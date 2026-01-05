/**
 * Hook for managing address book dialogs (edit/delete)
 */

import { useState } from "react";
import { toast } from "sonner";
import type {
	useDeleteAddressBook,
	useUpdateAddressBook,
} from "@/hooks/use-address-books";

type DialogState =
	| { type: "delete"; addressBook: { id: string; name: string } }
	| {
			type: "edit";
			addressBook: { id: string; name: string; color?: string | null };
			newName: string;
			newColor: string | null;
	  }
	| null;

export function useAddressBookDialogHandlers(
	deleteAddressBook: ReturnType<
		typeof useDeleteAddressBook
	>["deleteAddressBook"],
	updateAddressBook: ReturnType<
		typeof useUpdateAddressBook
	>["updateAddressBook"],
) {
	const [dialog, setDialog] = useState<DialogState>(null);

	const openDeleteDialog = (id: string, name: string) => {
		setDialog({ type: "delete", addressBook: { id, name } });
	};

	const openEditDialog = (id: string, name: string, color?: string | null) => {
		setDialog({
			type: "edit",
			addressBook: { id, name, color },
			newName: name,
			newColor: color || null,
		});
	};

	const closeDialog = () => {
		setDialog(null);
	};

	const handleEditNameChange = (value: string) => {
		setDialog((prev) => {
			if (prev?.type === "edit") {
				return { ...prev, newName: value };
			}
			return prev;
		});
	};

	const handleEditColorChange = (value: string | null) => {
		setDialog((prev) => {
			if (prev?.type === "edit") {
				return { ...prev, newColor: value };
			}
			return prev;
		});
	};

	const confirmDelete = () => {
		if (dialog?.type === "delete") {
			deleteAddressBook({
				id: dialog.addressBook.id,
				name: dialog.addressBook.name,
			});
			closeDialog();
		}
	};

	const confirmEdit = async () => {
		if (dialog?.type === "edit") {
			const trimmedName = dialog.newName.trim();
			if (trimmedName) {
				await updateAddressBook({
					id: dialog.addressBook.id,
					name: trimmedName,
					color: dialog.newColor,
				});
				closeDialog();
			} else {
				toast.error("Name cannot be empty");
			}
		}
	};

	return {
		dialog,
		openDeleteDialog,
		openEditDialog,
		closeDialog,
		handleEditNameChange,
		handleEditColorChange,
		confirmDelete,
		confirmEdit,
	};
}
