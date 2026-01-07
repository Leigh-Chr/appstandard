/**
 * Address Book Group Detail Page
 * Displays group details with address books and management actions
 */

import { cn, useIsMobile } from "@appstandard/react-utils";
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
	buttonVariants,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Skeleton,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Download,
	Edit,
	GitMerge,
	Link2,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AccountPrompt } from "@/components/account-prompt";
import {
	AddressBookSearchSortBar,
	type AddressBookSortBy,
} from "@/components/address-book-list/address-book-filters";
import { CreateGroupDialog } from "@/components/address-book-list/create-group-dialog";
import { GroupMembersList } from "@/components/group-members-list";
import { InviteGroupMemberDialog } from "@/components/invite-group-member-dialog";
import { ShareAddressBooksDialog } from "@/components/share-address-books-dialog";
import { exportGroupAsVCFFile } from "@/lib/address-book-export";
import { authClient } from "@/lib/auth-client";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/contacts/groups/$groupId")({
	component: GroupDetailComponent,
});

type AddressBookForGroupSort = {
	id: string;
	name: string;
	color?: string | null;
	contactCount: number;
};

/**
 * Filter address books by keyword
 */
function filterGroupAddressBooksByKeyword(
	addressBooks: AddressBookForGroupSort[],
	keyword: string,
): AddressBookForGroupSort[] {
	if (!keyword.trim()) {
		return addressBooks;
	}
	const searchLower = keyword.trim().toLowerCase();
	return addressBooks.filter((ab) =>
		ab.name.toLowerCase().includes(searchLower),
	);
}

/**
 * Sort address books in group
 */
function sortGroupAddressBooks(
	addressBooks: AddressBookForGroupSort[],
	sortBy: AddressBookSortBy,
): AddressBookForGroupSort[] {
	const sorted = [...addressBooks];
	if (sortBy === "name") {
		sorted.sort((a, b) => a.name.localeCompare(b.name));
	} else if (sortBy === "contactCount") {
		sorted.sort((a, b) => a.contactCount - b.contactCount);
	}
	return sorted;
}

/**
 * Render address books grid or empty states
 */
function renderAddressBooksGrid(
	addressBooksArray: AddressBookForGroupSort[],
	filteredAddressBooks: AddressBookForGroupSort[],
	onAddressBookClick: (id: string) => void,
	onEdit: () => void,
) {
	if (addressBooksArray.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>No address books in this group</CardTitle>
					<CardDescription>
						Add address books to this group to get started.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onClick={onEdit} variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Add address books
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (filteredAddressBooks.length === 0) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">
						No address books match your search
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{filteredAddressBooks.map((addressBook) => (
				<Card
					key={addressBook.id}
					className="group relative cursor-pointer overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
					onClick={() => onAddressBookClick(addressBook.id)}
				>
					{/* Color accent */}
					<div
						className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
						style={{ backgroundColor: addressBook.color || "#D4A017" }}
					/>

					<CardHeader className="pb-2 pl-6">
						<CardTitle className="line-clamp-1 text-card-title">
							{addressBook.name}
						</CardTitle>
						<CardDescription>
							{addressBook.contactCount} contact
							{addressBook.contactCount !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}

// Helper to filter and sort address books
function useFilteredAddressBooks(
	addressBooks: unknown[],
	searchKeyword: string,
	sortBy: AddressBookSortBy,
) {
	if (!addressBooks.length) return [];
	const filtered = filterGroupAddressBooksByKeyword(
		addressBooks as AddressBookForGroupSort[],
		searchKeyword,
	);
	return sortGroupAddressBooks(filtered, sortBy);
}

// Hook for group actions and mutations
function useGroupActions(
	groupId: string,
	group: { name: string; addressBooks: Array<{ id: string }> } | undefined,
	queryClient: ReturnType<typeof useQueryClient>,
	navigate: ReturnType<typeof useNavigate>,
) {
	const deleteMutation = useMutation(
		trpc.group.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contactGroup.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group deleted");
				navigate({ to: "/contacts" });
			},
			onError: (error) => {
				toast.error(error.message || "Error deleting group");
			},
		}),
	);

	const handleMerge = useCallback(() => {
		if (group && group.addressBooks.length > 0) {
			const addressBookIds = group.addressBooks.map((a) => a.id).join(",");
			navigate({
				to: "/contacts/merge",
				search: { selected: addressBookIds },
			});
		}
	}, [group, navigate]);

	const handleExport = useCallback(async () => {
		try {
			await exportGroupAsVCFFile(groupId);
			toast.success("Group exported successfully");
		} catch (_error) {
			toast.error("Error exporting group");
		}
	}, [groupId]);

	return { deleteMutation, handleMerge, handleExport };
}

// Loading state component
function GroupDetailLoading() {
	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>
			<div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
				<Skeleton className="mb-4 h-8 w-64" />
				<Skeleton className="mb-8 h-32 w-full" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			</div>
		</div>
	);
}

// Not found state component
function GroupDetailNotFound() {
	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>
			<div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
				<div className="text-center text-muted-foreground">Group not found</div>
			</div>
		</div>
	);
}

// Header component
interface GroupDetailHeaderProps {
	group: { name: string; color?: string | null; description?: string | null };
	addressBooksArray: Array<{ contactCount: number }>;
	totalContacts: number;
	isMobile: boolean;
	navigate: ReturnType<typeof useNavigate>;
	onEdit: () => void;
	onDelete: () => void;
	onShare: () => void;
	onMerge: () => void;
	onExport: () => void;
	deleteMutation: ReturnType<
		typeof useMutation<{ success: boolean }, unknown, { id: string }, unknown>
	>;
}

function GroupDetailHeader({
	group,
	addressBooksArray,
	totalContacts,
	isMobile,
	navigate,
	onEdit,
	onDelete,
	onShare,
	onMerge,
	onExport,
	deleteMutation,
}: GroupDetailHeaderProps) {
	return (
		<div className="mb-6 flex flex-wrap items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				className="min-h-[44px] sm:min-h-0"
				onClick={() => navigate({ to: "/contacts" })}
				aria-label="Back to contacts"
			>
				<ArrowLeft className="h-4 w-4" />
				<span className="sr-only">Back to contacts</span>
			</Button>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-3">
					<div
						className="h-4 w-4 shrink-0 rounded-full"
						style={{ backgroundColor: group.color || "#8b5cf6" }}
					/>
					<h1 className="text-heading-1">{group.name}</h1>
				</div>
				{group.description && (
					<p className="mt-1 text-muted-foreground">{group.description}</p>
				)}
				<p className="mt-1 text-muted-foreground text-sm">
					{addressBooksArray.length} address book
					{addressBooksArray.length !== 1 ? "s" : ""} • {totalContacts} contact
					{totalContacts !== 1 ? "s" : ""}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-3 sm:gap-2">
				{isMobile ? (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={onEdit}
							className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
						>
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
								>
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">More actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" mobileAlign="start">
								<DropdownMenuItem
									onClick={onShare}
									disabled={addressBooksArray.length === 0}
								>
									<Link2 className="mr-2 h-4 w-4" />
									Share
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={onMerge}
									disabled={addressBooksArray.length < 2}
								>
									<GitMerge className="mr-2 h-4 w-4" />
									Merge
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={onExport}
									disabled={addressBooksArray.length === 0}
								>
									<Download className="mr-2 h-4 w-4" />
									Export
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onDelete}
									disabled={deleteMutation.isPending}
									className="text-destructive focus:text-destructive"
								>
									{deleteMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="mr-2 h-4 w-4" />
									)}
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				) : (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={onEdit}
							className="h-8"
						>
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onShare}
							disabled={addressBooksArray.length === 0}
							className="h-8"
						>
							<Link2 className="mr-2 h-4 w-4" />
							Share
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onMerge}
							disabled={addressBooksArray.length < 2}
							className="h-8"
						>
							<GitMerge className="mr-2 h-4 w-4" />
							Merge
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onExport}
							disabled={addressBooksArray.length === 0}
							className="h-8"
						>
							<Download className="mr-2 h-4 w-4" />
							Export
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={onDelete}
							disabled={deleteMutation.isPending}
							className="h-8"
						>
							{deleteMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="mr-2 h-4 w-4" />
							)}
							Delete
						</Button>
					</>
				)}
			</div>
		</div>
	);
}

function GroupDetailComponent() {
	const { groupId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();

	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");
	const [sortBy, setSortBy] = useState<AddressBookSortBy>("name");

	// Get current user session
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user?.id;

	// Fetch group details
	const { data: group, isLoading } = useQuery({
		...trpc.group.getById.queryOptions({ id: groupId }),
	});

	// Ensure addressBooks is always an array
	const addressBooksArray = Array.isArray(group?.addressBooks)
		? group.addressBooks
		: [];
	const filteredAddressBooks = useFilteredAddressBooks(
		addressBooksArray,
		searchKeyword,
		sortBy,
	);

	const { deleteMutation, handleMerge, handleExport } = useGroupActions(
		groupId,
		group,
		queryClient,
		navigate,
	);

	// Handlers
	const handleEdit = useCallback(() => {
		if (group) setEditDialogOpen(true);
	}, [group]);

	const handleDelete = useCallback(() => {
		setDeleteDialogOpen(true);
	}, []);

	const handleShare = useCallback(() => {
		if (addressBooksArray.length > 0) {
			setShareDialogOpen(true);
		}
	}, [addressBooksArray.length]);

	if (isLoading) return <GroupDetailLoading />;
	if (!group) return <GroupDetailNotFound />;

	const totalContacts = addressBooksArray.reduce(
		(sum, ab) => sum + ab.contactCount,
		0,
	);

	// Check if current user is owner
	const isOwner = currentUserId
		? group.userId === currentUserId ||
			(group.members?.some(
				(m: { userId: string; role: string }) =>
					m.userId === currentUserId && m.role === "OWNER",
			) ??
				false)
		: group.userId === null;

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
				<AccountPrompt variant="banner" />
				<GroupDetailHeader
					group={group}
					addressBooksArray={addressBooksArray}
					totalContacts={totalContacts}
					isMobile={isMobile}
					navigate={navigate}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onShare={handleShare}
					onMerge={handleMerge}
					onExport={handleExport}
					deleteMutation={deleteMutation}
				/>

				{/* Search and sort */}
				{addressBooksArray.length > 0 && (
					<div className="mb-4">
						<AddressBookSearchSortBar
							keyword={searchKeyword}
							sortBy={sortBy}
							onKeywordChange={setSearchKeyword}
							onSortChange={(newSortBy) => {
								setSortBy(newSortBy);
							}}
							showDirectionToggle={false}
							sortOptions={[
								{ value: "name", label: "Name A-Z" },
								{ value: "contactCount", label: "Contact count" },
							]}
						/>
					</div>
				)}

				{/* Address books grid */}
				{renderAddressBooksGrid(
					addressBooksArray,
					filteredAddressBooks,
					(id) => navigate({ to: `/contacts/${id}` }),
					handleEdit,
				)}

				{/* Members section (only for authenticated users) */}
				{currentUserId && (
					<div className="mt-8">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								<h2 className="text-heading-2">Members</h2>
							</div>
							{isOwner && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setInviteDialogOpen(true)}
								>
									<Plus className="mr-2 h-4 w-4" />
									Invite member
								</Button>
							)}
						</div>
						<GroupMembersList
							groupId={groupId}
							isOwner={isOwner}
							currentUserId={currentUserId}
						/>
					</div>
				)}

				{/* Invite member dialog */}
				<InviteGroupMemberDialog
					groupId={groupId}
					open={inviteDialogOpen}
					onOpenChange={setInviteDialogOpen}
				/>

				{/* Edit dialog */}
				{group && (
					<CreateGroupDialog
						open={editDialogOpen}
						onOpenChange={setEditDialogOpen}
						groupToEdit={{
							id: group.id,
							name: group.name,
							description: group.description || null,
							color: group.color || null,
						}}
					/>
				)}

				{/* Share address books dialog */}
				<ShareAddressBooksDialog
					addressBookIds={addressBooksArray.map((ab) => ab.id)}
					open={shareDialogOpen}
					onOpenChange={setShareDialogOpen}
				/>

				{/* Delete confirmation */}
				<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete group?</AlertDialogTitle>
							<AlertDialogDescription>
								This will delete the group "{group.name}". The address books in
								this group will not be deleted, only the group itself.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									deleteMutation.mutate({ id: groupId });
									setDeleteDialogOpen(false);
								}}
								className={cn(buttonVariants({ variant: "destructive" }))}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
