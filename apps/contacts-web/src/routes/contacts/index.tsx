/**
 * Address books list page
 * Follows AppStandard Calendar pattern for consistency
 */

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	ColorPicker,
	Input,
	Label,
} from "@appstandard/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AnimatePresence } from "motion/react";
import { AccountPrompt } from "@/components/account-prompt";
import {
	AddressBookSearchSortBar,
	type AddressBookSortBy,
	type AddressBookSortDirection,
} from "@/components/address-book-list/address-book-filters";
import { AddressBooksSection } from "@/components/address-book-list/address-books-section";
import { AddressBookBulkActionsBar } from "@/components/address-book-list/bulk-actions-bar";
import { GroupsSection } from "@/components/address-book-list/groups-section";
import { AddressBooksListHeader } from "@/components/address-book-list/header";
import { AddressBooksListLoadingState } from "@/components/address-book-list/loading-state";
import { useAddressBookDialogHandlers } from "@/hooks/use-address-book-dialogs";
import { useAddressBookGroupHandlers } from "@/hooks/use-address-book-groups";
import { useAddressBookSearchSortHandlers } from "@/hooks/use-address-book-search-sort";
import { useAddressBookSelectionHandlers } from "@/hooks/use-address-book-selection";
import {
	useAddressBooks,
	useDeleteAddressBook,
	useUpdateAddressBook,
} from "@/hooks/use-address-books";
import {
	type AddressBookForSort,
	filterAddressBooksByKeyword,
	sortAddressBooks,
} from "@/lib/address-book-sort";
import {
	addressBooksListDefaults,
	addressBooksListSearchSchema,
} from "@/lib/search-params";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/contacts/")({
	component: AddressBooksListPage,
	validateSearch: zodValidator(addressBooksListSearchSchema),
	search: {
		middlewares: [stripSearchParams(addressBooksListDefaults)],
	},
	errorComponent: ({ error }) => {
		if (import.meta.env.DEV) {
			console.error("Route error:", error);
		}
		return (
			<div className="container mx-auto max-w-2xl px-4 py-10">
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
					<h2 className="font-semibold text-destructive text-lg">
						An error occurred
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{error?.message ||
							"An unexpected error occurred. Please try again."}
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-4 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
					>
						Reload page
					</button>
				</div>
			</div>
		);
	},
	head: () => ({
		meta: [
			{ title: "My Address Books - AppStandard Contacts" },
			{
				name: "description",
				content: "Manage all your contacts and address books in one place.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

/**
 * All dialogs component
 */
function AddressBooksListDialogs({
	dialogHandlers,
	groupHandlers,
	isDeleting,
	isUpdating,
}: {
	dialogHandlers: ReturnType<typeof useAddressBookDialogHandlers>;
	groupHandlers: ReturnType<typeof useAddressBookGroupHandlers>;
	isDeleting: boolean;
	isUpdating: boolean;
}) {
	return (
		<>
			{/* Delete Dialog */}
			<AlertDialog
				open={dialogHandlers.dialog?.type === "delete"}
				onOpenChange={(open) => !open && dialogHandlers.closeDialog()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete address book</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "
							{dialogHandlers.dialog?.type === "delete"
								? dialogHandlers.dialog.addressBook.name
								: ""}
							"? This action is irreversible and will delete all contacts.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={dialogHandlers.confirmDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Edit Dialog */}
			<AlertDialog
				open={dialogHandlers.dialog?.type === "edit"}
				onOpenChange={(open) => !open && dialogHandlers.closeDialog()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Edit address book</AlertDialogTitle>
						<AlertDialogDescription>
							Edit settings for "
							{dialogHandlers.dialog?.type === "edit"
								? dialogHandlers.dialog.addressBook.name
								: ""}
							"
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="address-book-name">Name</Label>
							<Input
								id="address-book-name"
								value={
									dialogHandlers.dialog?.type === "edit"
										? dialogHandlers.dialog.newName
										: ""
								}
								onChange={(e) =>
									dialogHandlers.handleEditNameChange(e.target.value)
								}
								placeholder="Address book name"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										dialogHandlers.confirmEdit();
									}
								}}
							/>
						</div>
						<ColorPicker
							value={
								dialogHandlers.dialog?.type === "edit"
									? dialogHandlers.dialog.newColor
									: null
							}
							onChange={dialogHandlers.handleEditColorChange}
							label="Color"
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={dialogHandlers.confirmEdit}
							disabled={isUpdating}
						>
							{isUpdating ? "Saving..." : "Save"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete group dialog */}
			<AlertDialog
				open={groupHandlers.deleteGroupDialogOpen}
				onOpenChange={groupHandlers.setDeleteGroupDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete group?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete the group. The address books in this group will
							not be deleted, only the group itself.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (groupHandlers.groupToDelete) {
									groupHandlers.deleteGroupMutation.mutate({
										id: groupHandlers.groupToDelete,
									});
									groupHandlers.setDeleteGroupDialogOpen(false);
									groupHandlers.setGroupToDelete(null);
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

/**
 * Render address books list content
 */
function AddressBooksListContent({
	addressBooks,
	groups,
	isLoadingGroups,
	keyword,
	sortBy,
	sortDirection,
	navigate,
	selectionHandlers,
	searchSortHandlers,
	groupHandlers,
	dialogHandlers,
	isDeleting,
	isUpdating,
}: {
	addressBooks: AddressBookForSort[];
	groups:
		| Array<{
				id: string;
				name: string;
				description?: string | null;
				color?: string | null;
				addressBookCount: number;
		  }>
		| undefined;
	isLoadingGroups: boolean;
	keyword: string;
	sortBy: AddressBookSortBy;
	sortDirection: AddressBookSortDirection;
	navigate: ReturnType<typeof useNavigate>;
	selectionHandlers: ReturnType<typeof useAddressBookSelectionHandlers>;
	searchSortHandlers: ReturnType<typeof useAddressBookSearchSortHandlers>;
	groupHandlers: ReturnType<typeof useAddressBookGroupHandlers>;
	dialogHandlers: ReturnType<typeof useAddressBookDialogHandlers>;
	isDeleting: boolean;
	isUpdating: boolean;
}) {
	return (
		<>
			<AccountPrompt variant="banner" />

			{/* Search and sort */}
			{addressBooks.length > 0 && (
				<div className="mb-4">
					<AddressBookSearchSortBar
						keyword={keyword}
						sortBy={sortBy}
						sortDirection={sortDirection}
						onKeywordChange={searchSortHandlers.handleKeywordChange}
						onSortChange={searchSortHandlers.handleSortChange}
						onSortDirectionChange={searchSortHandlers.handleSortDirectionChange}
						showDirectionToggle={
							sortBy === "updatedAt" || sortBy === "createdAt"
						}
					/>
				</div>
			)}

			{/* Bulk actions bar */}
			<AnimatePresence>
				{selectionHandlers.selectionMode && (
					<AddressBookBulkActionsBar
						selectedCount={selectionHandlers.selectedIds.size}
						totalCount={addressBooks.length}
						onSelectAll={selectionHandlers.handleSelectAll}
						onDeselectAll={selectionHandlers.handleDeselectAll}
						onExitSelectionMode={selectionHandlers.handleExitSelectionMode}
						selectedIds={selectionHandlers.selectedIds}
					/>
				)}
			</AnimatePresence>

			{/* Groups section */}
			{!isLoadingGroups && groups && groups.length > 0 && (
				<GroupsSection
					groups={groups.map((g) => ({
						id: g.id,
						name: g.name,
						description: g.description,
						color: g.color,
						addressBookCount: g.addressBookCount,
					}))}
					groupHandlers={groupHandlers}
				/>
			)}

			{/* Address books section */}
			<AddressBooksSection
				addressBooks={addressBooks}
				navigate={navigate}
				dialogHandlers={dialogHandlers}
				selectionHandlers={selectionHandlers}
				isDeleting={isDeleting}
				isUpdating={isUpdating}
			/>
		</>
	);
}

function AddressBooksListPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const search = Route.useSearch();

	// Parse filters from URL
	const keyword = search["q"] || "";
	const sortBy = search["sortBy"] || "updatedAt";
	const sortDirection = search["sortDirection"] || "desc";

	// Get address books
	const { addressBooks: allAddressBooks, isLoading } = useAddressBooks();

	// Filter and sort address books
	const addressBooks = (() => {
		const booksArray = Array.isArray(allAddressBooks) ? allAddressBooks : [];
		const filtered = filterAddressBooksByKeyword(booksArray, keyword);
		return sortAddressBooks(filtered, sortBy, sortDirection);
	})();

	const { deleteAddressBook, isDeleting } = useDeleteAddressBook();
	const { updateAddressBook, isUpdating } = useUpdateAddressBook();

	// Dialog handlers
	const dialogHandlers = useAddressBookDialogHandlers(
		deleteAddressBook,
		updateAddressBook,
	);

	// Selection mode handlers
	const selectionHandlers = useAddressBookSelectionHandlers(addressBooks);

	// Groups state and handlers
	const groupHandlers = useAddressBookGroupHandlers(navigate, queryClient);

	// Get groups
	const { data: groups, isLoading: isLoadingGroups } = useQuery({
		...trpc.group.list.queryOptions(),
	});

	// Search and sort handlers
	const searchSortHandlers = useAddressBookSearchSortHandlers(
		navigate,
		search,
		sortDirection,
	);

	if (isLoading) {
		return <AddressBooksListLoadingState />;
	}

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background pattern */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
				<div className="cross-grid absolute inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,#000_0%,transparent_50%)]" />
			</div>

			<div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
				<AddressBooksListHeader
					addressBooks={addressBooks}
					navigate={navigate}
					groupHandlers={groupHandlers}
					selectionHandlers={selectionHandlers}
				/>

				<AddressBooksListContent
					addressBooks={addressBooks}
					groups={groups}
					isLoadingGroups={isLoadingGroups}
					keyword={keyword}
					sortBy={sortBy as AddressBookSortBy}
					sortDirection={sortDirection as AddressBookSortDirection}
					navigate={navigate}
					selectionHandlers={selectionHandlers}
					searchSortHandlers={searchSortHandlers}
					groupHandlers={groupHandlers}
					dialogHandlers={dialogHandlers}
					isDeleting={isDeleting}
					isUpdating={isUpdating}
				/>

				<AddressBooksListDialogs
					dialogHandlers={dialogHandlers}
					groupHandlers={groupHandlers}
					isDeleting={isDeleting}
					isUpdating={isUpdating}
				/>
			</div>
		</div>
	);
}
