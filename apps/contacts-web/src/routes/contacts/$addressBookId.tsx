import { useIsMobile } from "@appstandard/react-utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	stripSearchParams,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	ArrowRight,
	Building,
	Copy,
	Download,
	Edit2,
	Grid3X3,
	Link2,
	List,
	Loader2,
	Mail,
	Merge,
	MoreHorizontal,
	Phone,
	Plus,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
	Upload,
	User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountPrompt } from "@/components/account-prompt";
import { ContactFilterBar } from "@/components/contact-filters";
import { ExportAddressBookDialog } from "@/components/export-address-book-dialog";
import { MoveContactDialog } from "@/components/move-contact-dialog";
import { ShareAddressBookDialog } from "@/components/share-address-book-dialog";
import { useAddressBook } from "@/hooks/use-address-books";
import { useContacts, useDeleteContact } from "@/hooks/use-contacts";
import { QUERY_KEYS } from "@/lib/query-keys";
import {
	addressBookViewDefaults,
	addressBookViewSearchSchema,
	type ContactSortBy,
	type SortDirection,
} from "@/lib/search-params";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/contacts/$addressBookId")({
	component: AddressBookDetailPage,
	validateSearch: zodValidator(addressBookViewSearchSchema),
	search: {
		middlewares: [stripSearchParams(addressBookViewDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "Address Book - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function AddressBookDetailPage() {
	const { addressBookId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();
	const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [moveDialogOpen, setMoveDialogOpen] = useState(false);
	const [contactToMove, setContactToMove] = useState<string | null>(null);

	// URL-driven view mode and filters
	const viewMode = search["view"];

	// Helper for updating search params on current route
	const updateSearch = (updates: Partial<typeof search>) => {
		navigate({
			to: ".",
			search: { ...search, ...updates },
		});
	};

	const { addressBook, isLoading: isLoadingBook } =
		useAddressBook(addressBookId);
	const { contacts, isLoading: isLoadingContacts } = useContacts(addressBookId);
	const { deleteContact } = useDeleteContact();

	const isLoading = isLoadingBook || isLoadingContacts;

	// Clean duplicates mutation
	const cleanDuplicatesMutation = useMutation(
		trpc.merge.cleanDuplicates.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(addressBookId),
				});
				if (data.removedCount > 0) {
					toast.success(
						`${data.removedCount} duplicate(s) cleaned up. ${data.remainingContacts} contact(s) remaining.`,
					);
				} else {
					toast.info("No duplicates found in this address book.");
				}
				setCleanDialogOpen(false);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error
						? error.message
						: "Error during duplicate cleanup";
				toast.error(message);
			},
		}),
	);

	// Refresh from URL mutation
	const refreshFromUrlMutation = useMutation(
		trpc.import.refreshFromUrl.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(addressBookId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});

				toast.success(
					`Address book refreshed! ${data.importedContacts} contact(s) imported, ${data.skippedDuplicates} duplicate(s) skipped.`,
				);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during refresh";
				toast.error(message);
			},
		}),
	);

	// Duplicate contact mutation
	const duplicateContactMutation = useMutation(
		trpc.contact.duplicate.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(addressBookId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Contact duplicated successfully");
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error duplicating contact";
				toast.error(message);
			},
		}),
	);

	const handleCleanDuplicates = () => {
		cleanDuplicatesMutation.mutate({ addressBookId });
	};

	const handleRefreshFromUrl = () => {
		refreshFromUrlMutation.mutate({
			addressBookId,
			replaceAll: false,
			skipDuplicates: true,
		});
	};

	const handleDuplicateContact = (contactId: string) => {
		duplicateContactMutation.mutate({ id: contactId });
	};

	const handleMoveContact = (contactId: string) => {
		setContactToMove(contactId);
		setMoveDialogOpen(true);
	};

	// Filter and sort contacts using URL params
	const filteredContacts = useMemo(() => {
		if (!contacts) return [];

		let result = [...contacts];

		// Apply search filter from URL
		if (search["q"]) {
			const searchLower = search["q"].toLowerCase();
			result = result.filter(
				(contact) =>
					contact.formattedName.toLowerCase().includes(searchLower) ||
					contact.primaryEmail?.toLowerCase().includes(searchLower) ||
					contact.organization?.toLowerCase().includes(searchLower),
			);
		}

		// Apply sorting from URL
		result.sort((a, b) => {
			let comparison = 0;

			switch (search["sortBy"]) {
				case "name":
					comparison = a.formattedName.localeCompare(b.formattedName);
					break;
				case "organization": {
					const aOrg = a.organization || "";
					const bOrg = b.organization || "";
					comparison = aOrg.localeCompare(bOrg);
					break;
				}
				case "updated": {
					const aDate = new Date(a.updatedAt).getTime();
					const bDate = new Date(b.updatedAt).getTime();
					comparison = aDate - bDate;
					break;
				}
			}

			return search["sortDirection"] === "asc" ? comparison : -comparison;
		});

		return result;
	}, [contacts, search["q"], search["sortBy"], search["sortDirection"]]);

	const handleFiltersChange = (updates: {
		search?: string;
		sortBy?: ContactSortBy;
		sortDirection?: SortDirection;
	}) => {
		updateSearch({
			q: updates.search !== undefined ? updates.search : search["q"],
			sortBy: updates.sortBy ?? search["sortBy"],
			sortDirection: updates.sortDirection ?? search["sortDirection"],
		});
	};

	const handleDeleteContact = (contactId: string, name?: string) => {
		deleteContact({ id: contactId, name });
	};

	// Check if we're on a child route (like /contacts/new or /$contactId)
	// If so, render the child route via Outlet
	// IMPORTANT: This must be AFTER all hooks to respect Rules of Hooks
	const isChildRoute =
		location.pathname !== `/contacts/${addressBookId}` &&
		location.pathname.startsWith(`/contacts/${addressBookId}/contacts/`);

	if (isChildRoute) {
		return <Outlet />;
	}

	if (isLoading) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-30" />
				</div>
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="flex min-h-[400px] items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				</div>
			</div>
		);
	}

	if (!addressBook) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-30" />
				</div>
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
						<p className="text-destructive">Address book not found.</p>
						<Link
							to="/contacts"
							className="mt-2 inline-block text-sm underline"
						>
							Go back to address books
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const contactsList = contacts ?? [];
	const hasActiveFilters = search["q"] !== "";

	// Group contacts by first letter
	const groupedContacts = filteredContacts.reduce(
		(acc, contact) => {
			const letter =
				contact.formattedName.length > 0
					? contact.formattedName.charAt(0).toUpperCase()
					: "#";
			if (!acc[letter]) {
				acc[letter] = [];
			}
			acc[letter].push(contact);
			return acc;
		},
		{} as Record<string, typeof contactsList>,
	);

	const sortedLetters = Object.keys(groupedContacts).sort();

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
				<AccountPrompt variant="banner" />

				{/* Header */}
				<div className="mb-6 flex flex-wrap items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						className="min-h-[44px] sm:min-h-0"
						onClick={() => navigate({ to: "/contacts" })}
						aria-label="Back to address books"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="sr-only">Back to address books</span>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: addressBook.color || "#3b82f6" }}
							/>
							<h1 className="text-heading-1">{addressBook.name}</h1>
						</div>
						<p className="text-muted-foreground">
							{contactsList.length} contact(s)
						</p>
					</div>
					<div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-2">
						{/* Primary action - always visible */}
						<Button
							onClick={() =>
								navigate({ to: `/contacts/${addressBookId}/contacts/new` })
							}
							size="sm"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add a contact
						</Button>
						{/* Mobile: More actions menu */}
						{isMobile ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">More actions</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" mobileAlign="start">
									<DropdownMenuItem
										onClick={() => navigate({ to: "/contacts/import" })}
									>
										<Upload className="mr-2 h-4 w-4" />
										Import
									</DropdownMenuItem>
									{addressBook.sourceUrl && (
										<DropdownMenuItem
											onClick={handleRefreshFromUrl}
											disabled={refreshFromUrlMutation.isPending}
										>
											{refreshFromUrlMutation.isPending ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<RefreshCw className="mr-2 h-4 w-4" />
											)}
											Refresh
										</DropdownMenuItem>
									)}
									<DropdownMenuItem onClick={() => setCleanDialogOpen(true)}>
										<Sparkles className="mr-2 h-4 w-4" />
										Clean up
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											navigate({
												to: "/contacts/merge",
												search: { selected: addressBookId },
											})
										}
									>
										<Merge className="mr-2 h-4 w-4" />
										Merge
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
										<Download className="mr-2 h-4 w-4" />
										Export
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
										<Link2 className="mr-2 h-4 w-4" />
										Share
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<>
								{/* Desktop: All actions visible */}
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigate({ to: "/contacts/import" })}
								>
									<Upload className="mr-2 h-4 w-4" />
									Import
								</Button>
								{/* Refresh button - only shown for address books with a source URL */}
								{addressBook.sourceUrl && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleRefreshFromUrl}
										disabled={refreshFromUrlMutation.isPending}
										title={
											addressBook.lastSyncedAt
												? `Last synced ${formatDistanceToNow(new Date(addressBook.lastSyncedAt), { addSuffix: true })}. Click to refresh.`
												: `Refresh from ${addressBook.sourceUrl}`
										}
									>
										{refreshFromUrlMutation.isPending ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="mr-2 h-4 w-4" />
										)}
										Refresh
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCleanDialogOpen(true)}
								>
									<Sparkles className="mr-2 h-4 w-4" />
									Clean up
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										navigate({
											to: "/contacts/merge",
											search: { selected: addressBookId },
										})
									}
								>
									<Merge className="mr-2 h-4 w-4" />
									Merge
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setExportDialogOpen(true)}
								>
									<Download className="mr-2 h-4 w-4" />
									Export
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShareDialogOpen(true)}
								>
									<Link2 className="mr-2 h-4 w-4" />
									Share
								</Button>
							</>
						)}
					</div>
				</div>

				{/* View toggle */}
				<div className="mb-4 flex items-center gap-2">
					<div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
							onClick={() => updateSearch({ view: "list" })}
						>
							<List className="mr-2 h-4 w-4" />
							List
						</Button>
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
							onClick={() => updateSearch({ view: "grid" })}
						>
							<Grid3X3 className="mr-2 h-4 w-4" />
							Grid
						</Button>
					</div>
				</div>

				{/* Filter bar */}
				{contactsList.length > 0 && (
					<div className="mb-6">
						<ContactFilterBar
							filters={{
								search: search["q"],
								sortBy: search["sortBy"],
								sortDirection: search["sortDirection"],
							}}
							onFiltersChange={handleFiltersChange}
						/>
					</div>
				)}

				{/* Contacts display - List or Grid view */}
				{sortedLetters.length > 0 ? (
					viewMode === "grid" ? (
						/* Grid View */
						<div className="space-y-6">
							<AnimatePresence mode="popLayout">
								{sortedLetters.map((letter) => (
									<div key={letter}>
										{/* Animated letter header */}
										<motion.div
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className="sticky top-0 z-10 mb-3 flex items-center gap-3 bg-gradient-to-r from-background via-background to-transparent py-2"
										>
											<span className="font-semibold text-muted-foreground text-sm">
												{letter}
											</span>
											<div className="h-px flex-1 bg-border" />
											<span className="text-muted-foreground/60 text-xs">
												{(groupedContacts[letter] ?? []).length} contact
												{(groupedContacts[letter] ?? []).length > 1 ? "s" : ""}
											</span>
										</motion.div>
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
											{(groupedContacts[letter] ?? []).map((contact) => (
												<motion.div
													key={contact.id}
													initial={{ opacity: 0, scale: 0.95 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.95 }}
													className="group relative flex flex-col items-center rounded-lg border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-md"
												>
													{/* Avatar */}
													<div
														className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
														style={{
															backgroundColor: `${addressBook.color || "#3b82f6"}20`,
														}}
													>
														<User
															className="h-8 w-8"
															style={{ color: addressBook.color || "#3b82f6" }}
														/>
													</div>

													{/* Name */}
													<p className="mb-1 line-clamp-1 font-medium text-sm">
														{contact.formattedName}
													</p>

													{/* Badges */}
													<div className="mb-2 flex flex-wrap justify-center gap-1">
														{contact.primaryEmail && (
															<span
																className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/30"
																title={contact.primaryEmail}
															>
																<Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
															</span>
														)}
														{contact.primaryPhone && (
															<span
																className="rounded-full bg-green-100 p-1 dark:bg-green-900/30"
																title={contact.primaryPhone}
															>
																<Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
															</span>
														)}
														{contact.organization && (
															<span
																className="rounded-full bg-purple-100 p-1 dark:bg-purple-900/30"
																title={contact.organization}
															>
																<Building className="h-3 w-3 text-purple-600 dark:text-purple-400" />
															</span>
														)}
													</div>

													{/* Organization */}
													{contact.organization && (
														<p className="line-clamp-1 text-muted-foreground text-xs">
															{contact.organization}
														</p>
													)}

													{/* Hover actions */}
													<div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
														<button
															type="button"
															onClick={() =>
																navigate({
																	to: `/contacts/${addressBookId}/contacts/${contact.id}`,
																})
															}
															className="rounded bg-background/80 p-1 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
														>
															<Edit2 className="h-3.5 w-3.5" />
														</button>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<button
																	type="button"
																	className="rounded bg-background/80 p-1 text-muted-foreground shadow-sm hover:bg-muted"
																>
																	<MoreHorizontal className="h-3.5 w-3.5" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={() =>
																		navigate({
																			to: `/contacts/${addressBookId}/contacts/${contact.id}`,
																		})
																	}
																>
																	<Edit2 className="mr-2 h-4 w-4" />
																	Edit
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleDuplicateContact(contact.id)
																	}
																	disabled={duplicateContactMutation.isPending}
																>
																	<Copy className="mr-2 h-4 w-4" />
																	Duplicate
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleMoveContact(contact.id)}
																>
																	<ArrowRight className="mr-2 h-4 w-4" />
																	Move to address book...
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() =>
																		handleDeleteContact(
																			contact.id,
																			contact.formattedName,
																		)
																	}
																	className="text-destructive focus:text-destructive"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</motion.div>
											))}
										</div>
									</div>
								))}
							</AnimatePresence>
						</div>
					) : (
						/* List View */
						<div className="space-y-6">
							<AnimatePresence mode="popLayout">
								{sortedLetters.map((letter) => (
									<div key={letter}>
										{/* Animated letter header */}
										<motion.div
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className="sticky top-0 z-10 mb-2 flex items-center gap-3 bg-gradient-to-r from-background via-background to-transparent py-2"
										>
											<User className="h-4 w-4 text-muted-foreground" />
											<span className="font-semibold text-muted-foreground text-sm">
												{letter}
											</span>
											<div className="h-px flex-1 bg-border" />
											<span className="text-muted-foreground/60 text-xs">
												{(groupedContacts[letter] ?? []).length} contact
												{(groupedContacts[letter] ?? []).length > 1 ? "s" : ""}
											</span>
										</motion.div>
										<div className="space-y-2">
											{(groupedContacts[letter] ?? []).map((contact) => (
												<motion.div
													key={contact.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -10 }}
													className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/30"
												>
													{/* Avatar */}
													<div
														className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
														style={{
															backgroundColor: `${addressBook.color || "#3b82f6"}20`,
														}}
													>
														<User
															className="h-5 w-5"
															style={{ color: addressBook.color || "#3b82f6" }}
														/>
													</div>

													{/* Contact info */}
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<p className="font-medium">
																{contact.formattedName}
															</p>
															{/* Inline badges */}
															<div className="flex gap-1">
																{contact.primaryEmail && (
																	<span
																		className="rounded-full bg-blue-100 p-0.5 dark:bg-blue-900/30"
																		title="Has email"
																	>
																		<Mail className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
																	</span>
																)}
																{contact.primaryPhone && (
																	<span
																		className="rounded-full bg-green-100 p-0.5 dark:bg-green-900/30"
																		title="Has phone"
																	>
																		<Phone className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
																	</span>
																)}
															</div>
														</div>
														<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
															{contact.primaryEmail && (
																<span className="flex items-center gap-1">
																	<Mail className="h-3 w-3" />
																	{contact.primaryEmail}
																</span>
															)}
															{contact.primaryPhone && (
																<span className="flex items-center gap-1">
																	<Phone className="h-3 w-3" />
																	{contact.primaryPhone}
																</span>
															)}
														</div>
														{contact.organization && (
															<p className="mt-0.5 text-muted-foreground text-xs">
																{contact.organization}
															</p>
														)}
													</div>

													{/* Actions */}
													<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
														<button
															type="button"
															onClick={() =>
																navigate({
																	to: `/contacts/${addressBookId}/contacts/${contact.id}`,
																})
															}
															className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
														>
															<Edit2 className="h-4 w-4" />
														</button>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<button
																	type="button"
																	className="rounded p-1.5 text-muted-foreground hover:bg-muted"
																>
																	<MoreHorizontal className="h-4 w-4" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={() =>
																		navigate({
																			to: `/contacts/${addressBookId}/contacts/${contact.id}`,
																		})
																	}
																>
																	<Edit2 className="mr-2 h-4 w-4" />
																	Edit
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleDuplicateContact(contact.id)
																	}
																	disabled={duplicateContactMutation.isPending}
																>
																	<Copy className="mr-2 h-4 w-4" />
																	Duplicate
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleMoveContact(contact.id)}
																>
																	<ArrowRight className="mr-2 h-4 w-4" />
																	Move to address book...
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() =>
																		handleDeleteContact(
																			contact.id,
																			contact.formattedName,
																		)
																	}
																	className="text-destructive focus:text-destructive"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</motion.div>
											))}
										</div>
									</div>
								))}
							</AnimatePresence>
						</div>
					)
				) : (
					/* Empty state */
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted p-4">
							{hasActiveFilters ? (
								<Search className="h-8 w-8 text-muted-foreground" />
							) : (
								<User className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
						<h3 className="mb-2 font-medium">
							{hasActiveFilters ? "No contacts found" : "No contacts yet"}
						</h3>
						<p className="text-muted-foreground text-sm">
							{hasActiveFilters
								? "Try adjusting your search query"
								: "Add your first contact using the button above"}
						</p>
					</div>
				)}

				{/* Clean duplicates dialog */}
				<AlertDialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Clean up duplicates</AlertDialogTitle>
							<AlertDialogDescription>
								This will remove all duplicate contacts (same name and email).
								This action is irreversible. Continue?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleCleanDuplicates}
								disabled={cleanDuplicatesMutation.isPending}
							>
								{cleanDuplicatesMutation.isPending ? "Cleaning..." : "Clean up"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Share Dialog */}
				<ShareAddressBookDialog
					addressBookId={addressBookId}
					addressBookName={addressBook.name}
					open={shareDialogOpen}
					onOpenChange={setShareDialogOpen}
				/>

				{/* Export Dialog */}
				<ExportAddressBookDialog
					addressBookId={addressBookId}
					addressBookName={addressBook.name}
					open={exportDialogOpen}
					onOpenChange={setExportDialogOpen}
				/>

				{/* Move Contact Dialog */}
				{contactToMove && (
					<MoveContactDialog
						open={moveDialogOpen}
						onOpenChange={(open) => {
							setMoveDialogOpen(open);
							if (!open) setContactToMove(null);
						}}
						contactIds={[contactToMove]}
						currentAddressBookId={addressBookId}
					/>
				)}
			</div>
		</div>
	);
}
