/**
 * Dialog for moving contact(s) to another address book
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookUser, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddressBooks } from "@/hooks/use-address-books";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface MoveContactDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contactIds: string[];
	currentAddressBookId: string;
	contactCount?: number;
}

export function MoveContactDialog({
	open,
	onOpenChange,
	contactIds,
	currentAddressBookId,
	contactCount = contactIds.length,
}: MoveContactDialogProps) {
	const queryClient = useQueryClient();
	const [targetAddressBookId, setTargetAddressBookId] = useState<string>("");

	// Get address books for move destination
	const { addressBooks, isLoading: isLoadingAddressBooks } = useAddressBooks();

	// Bulk move mutation
	const bulkMoveMutation = useMutation(
		trpc.contact.bulkMove.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(
					`${data.movedCount} contact(s) moved to "${data.targetAddressBookName}"`,
				);
				onOpenChange(false);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during move";
				toast.error(message);
			},
		}),
	);

	const handleMove = () => {
		if (!targetAddressBookId) return;
		bulkMoveMutation.mutate({
			contactIds,
			targetAddressBookId,
		});
	};

	// Filter address books to exclude current one
	const moveDestinations = Array.isArray(addressBooks)
		? addressBooks.filter((ab) => ab.id !== currentAddressBookId)
		: [];

	const isPending = bulkMoveMutation.isPending;
	const canMove =
		targetAddressBookId &&
		!isPending &&
		moveDestinations &&
		moveDestinations.length > 0;

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setTargetAddressBookId("");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Move {contactCount === 1 ? "contact" : `${contactCount} contacts`}
					</DialogTitle>
					<DialogDescription>
						Select the destination address book for{" "}
						{contactCount === 1 ? "this contact" : "these contacts"}.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{isLoadingAddressBooks ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : !moveDestinations || moveDestinations.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
							<BookUser className="h-8 w-8 text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								No other address books available. Create an address book first.
							</p>
						</div>
					) : (
						<Select
							value={targetAddressBookId}
							onValueChange={setTargetAddressBookId}
							disabled={isPending}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select destination address book..." />
							</SelectTrigger>
							<SelectContent>
								{moveDestinations.map((ab) => (
									<SelectItem key={ab.id} value={ab.id}>
										<div className="flex items-center gap-2">
											{ab.color && (
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: ab.color }}
												/>
											)}
											<span>{ab.name}</span>
											<span className="text-muted-foreground text-xs">
												({ab.contactCount} contact
												{ab.contactCount !== 1 ? "s" : ""})
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleMove} disabled={!canMove}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Moving...
							</>
						) : (
							<>
								<ArrowRight className="mr-2 h-4 w-4" />
								Move
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
