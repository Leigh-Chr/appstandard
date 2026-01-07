/**
 * Address books section component
 * Displays the address books grid or empty state
 */

import {
	Button,
	Card,
	CardContent,
	StaggerContainer,
	StaggerItem,
} from "@appstandard/ui";
import { Link, type useNavigate } from "@tanstack/react-router";
import { BookUser, FileUp, Plus } from "lucide-react";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { AddressBookCard } from "./address-book-card";

interface AddressBooksSectionProps {
	addressBooks: Array<{
		id: string;
		name: string;
		contactCount: number;
		color?: string | null;
		sourceUrl?: string | null;
		lastSyncedAt?: string | Date | null;
	}>;
	navigate: ReturnType<typeof useNavigate>;
	dialogHandlers: {
		openEditDialog: (id: string, name: string, color?: string | null) => void;
		openDeleteDialog: (id: string, name: string) => void;
	};
	selectionHandlers: {
		selectionMode: boolean;
		selectedIds: Set<string>;
		handleToggleSelect: (id: string) => void;
	};
	isDeleting: boolean;
	isUpdating: boolean;
}

export function AddressBooksSection({
	addressBooks,
	navigate,
	dialogHandlers,
	selectionHandlers,
	isDeleting,
	isUpdating,
}: AddressBooksSectionProps) {
	return (
		<div data-tour={TOUR_STEP_IDS.ADDRESS_BOOKS_SECTION}>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-heading-2">Address Books</h2>
			</div>

			{addressBooks.length === 0 ? (
				<Card id={TOUR_STEP_IDS.ADDRESS_BOOK_GRID}>
					<CardContent className="py-8 text-center sm:py-16">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:mb-6 sm:h-16 sm:w-16">
							<BookUser className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
						</div>
						<p className="mb-2 text-heading-3">No address books yet</p>
						<p className="mb-4 text-muted-foreground sm:mb-6">
							Create your first address book or import an existing .vcf file.
						</p>
						<div className="flex flex-col justify-center gap-3 sm:flex-row">
							<Button onClick={() => navigate({ to: "/contacts/new" })}>
								<Plus className="mr-2 h-4 w-4" />
								Create an address book
							</Button>
							<Button variant="outline" asChild>
								<Link to="/contacts/import">
									<FileUp className="mr-2 h-4 w-4" />
									Import a .vcf
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div id={TOUR_STEP_IDS.ADDRESS_BOOK_GRID}>
					<StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{addressBooks.map((addressBook) => (
							<StaggerItem key={addressBook.id}>
								<AddressBookCard
									addressBook={addressBook}
									onOpen={() => navigate({ to: `/contacts/${addressBook.id}` })}
									onEdit={() =>
										dialogHandlers.openEditDialog(
											addressBook.id,
											addressBook.name,
											addressBook.color,
										)
									}
									onDelete={() =>
										dialogHandlers.openDeleteDialog(
											addressBook.id,
											addressBook.name,
										)
									}
									isDeleting={isDeleting}
									isUpdating={isUpdating}
									selectionMode={selectionHandlers.selectionMode}
									isSelected={selectionHandlers.selectedIds.has(addressBook.id)}
									onToggleSelect={selectionHandlers.handleToggleSelect}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				</div>
			)}
		</div>
	);
}
