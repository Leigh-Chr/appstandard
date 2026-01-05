/**
 * Hook for managing task list dialogs (edit/delete)
 */

import { useState } from "react";
import { toast } from "sonner";
import type {
	useDeleteTaskList,
	useUpdateTaskList,
} from "@/hooks/use-task-lists";

type DialogState =
	| { type: "delete"; taskList: { id: string; name: string } }
	| {
			type: "edit";
			taskList: { id: string; name: string; color?: string | null };
			newName: string;
			newColor: string | null;
	  }
	| null;

export function useTaskListDialogHandlers(
	deleteTaskList: ReturnType<typeof useDeleteTaskList>["deleteTaskList"],
	updateTaskList: ReturnType<typeof useUpdateTaskList>["updateTaskList"],
) {
	const [dialog, setDialog] = useState<DialogState>(null);

	const openDeleteDialog = (id: string, name: string) => {
		setDialog({ type: "delete", taskList: { id, name } });
	};

	const openEditDialog = (id: string, name: string, color?: string | null) => {
		setDialog({
			type: "edit",
			taskList: { id, name, color },
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
			deleteTaskList({ id: dialog.taskList.id, name: dialog.taskList.name });
			closeDialog();
		}
	};

	const confirmEdit = async () => {
		if (dialog?.type === "edit") {
			const trimmedName = dialog.newName.trim();
			if (trimmedName) {
				await updateTaskList({
					id: dialog.taskList.id,
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
