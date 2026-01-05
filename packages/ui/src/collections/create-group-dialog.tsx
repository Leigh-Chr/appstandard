/**
 * Generic Create/Edit Group Dialog
 * Used by Calendar, Contacts, and Tasks apps
 */

import { useForm } from "@tanstack/react-form";
import { Folder, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { ColorPicker } from "../color-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../dialog";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import { Textarea } from "../textarea";

export interface SelectableItem {
	id: string;
	name: string;
	color: string | null;
	count: number;
}

export interface GroupToEdit {
	id: string;
	name: string;
	description?: string | null;
	color?: string | null;
}

export interface CreateGroupDialogLabels {
	/** Entity name in singular form (e.g., "calendar", "address book", "task list") */
	entitySingular: string;
	/** Entity name in plural form (e.g., "calendars", "address books", "task lists") */
	entityPlural: string;
	/** Sub-item name (e.g., "events", "contacts", "tasks") */
	subItemPlural: string;
	/** Default color for items */
	defaultColor: string;
	/** Placeholder example for name input (e.g., "Work calendars, Personal") */
	namePlaceholder: string;
}

export interface CreateGroupDialogProps {
	/** Labels for the entity being grouped */
	labels: CreateGroupDialogLabels;
	/** Whether the dialog is open */
	open: boolean;
	/** Callback when open state changes */
	onOpenChange: (open: boolean) => void;
	/** Available items to select */
	items: SelectableItem[];
	/** Pre-selected item IDs (for creating from selection) */
	initialItemIds?: string[];
	/** Group to edit (if provided, dialog is in edit mode) */
	groupToEdit?: GroupToEdit | undefined;
	/** Item IDs currently in the group (for edit mode) */
	currentItemIds?: string[];
	/** Whether a create/update operation is pending */
	isPending: boolean;
	/** Callback when create is clicked */
	onCreate: (data: {
		name: string;
		description: string | undefined;
		color: string | undefined;
		itemIds: string[];
	}) => void;
	/** Callback when update is clicked */
	onUpdate: (data: {
		id: string;
		name: string;
		description: string | null;
		color: string | null;
		addItemIds: string[];
		removeItemIds: string[];
	}) => void;
}

const createGroupSchema = z.object({
	name: z.string().min(1, "Please enter a group name"),
	description: z.string(),
	color: z.string().nullable(),
	selectedItemIds: z.array(z.string()),
});

export function CreateGroupDialog({
	labels,
	open,
	onOpenChange,
	items,
	initialItemIds = [],
	groupToEdit,
	currentItemIds = [],
	isPending,
	onCreate,
	onUpdate,
}: CreateGroupDialogProps) {
	const isEditMode = !!groupToEdit;

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			color: null as string | null,
			selectedItemIds: [] as string[],
		},
		validators: {
			onSubmit: createGroupSchema,
		},
		onSubmit: ({ value }) => {
			const selectedSet = new Set(value.selectedItemIds);

			if (isEditMode && groupToEdit) {
				// Calculate items to add and remove
				const currentSet = new Set(currentItemIds);
				const addItemIds = value.selectedItemIds.filter(
					(id) => !currentSet.has(id),
				);
				const removeItemIds = Array.from(currentSet).filter(
					(id) => !selectedSet.has(id),
				);

				onUpdate({
					id: groupToEdit.id,
					name: value.name.trim(),
					description: value.description.trim() || null,
					color: value.color || null,
					addItemIds,
					removeItemIds,
				});
			} else {
				if (selectedSet.size === 0) {
					toast.error(`Please select at least one ${labels.entitySingular}`);
					return;
				}
				onCreate({
					name: value.name.trim(),
					description: value.description.trim() || undefined,
					color: value.color || undefined,
					itemIds: value.selectedItemIds,
				});
			}
		},
	});

	// Initialize form when dialog opens or group changes
	useEffect(() => {
		if (open) {
			if (isEditMode && groupToEdit) {
				form.setFieldValue("name", groupToEdit.name);
				form.setFieldValue("description", groupToEdit.description || "");
				form.setFieldValue("color", groupToEdit.color || null);
				form.setFieldValue("selectedItemIds", currentItemIds);
			} else {
				form.reset();
				form.setFieldValue("selectedItemIds", initialItemIds);
			}
		}
	}, [open, isEditMode, groupToEdit, currentItemIds, initialItemIds, form]);

	const handleToggleItem = (itemId: string): void => {
		const currentIds = form.getFieldValue("selectedItemIds");
		const currentSet = new Set(currentIds);
		if (currentSet.has(itemId)) {
			currentSet.delete(itemId);
		} else {
			currentSet.add(itemId);
		}
		form.setFieldValue("selectedItemIds", Array.from(currentSet));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-lg flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="flex items-center gap-2">
						<Folder className="h-5 w-5" />
						{isEditMode ? "Edit group" : "Create group"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? `Update the group name, description, color, and ${labels.entityPlural}.`
							: `Organize your ${labels.entityPlural} into groups for easier management.`}
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
				>
					{/* Name */}
					<form.Field name="name">
						{(field) => (
							<div className="shrink-0 space-y-2">
								<Label htmlFor={field.name}>Name *</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder={`e.g., ${labels.namePlaceholder}`}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									onKeyDown={(e) => e.key === "Enter" && form.handleSubmit()}
									disabled={isPending}
									aria-describedby={
										field.state.meta.errors.length > 0
											? `${field.name}-error`
											: undefined
									}
									aria-invalid={
										field.state.meta.errors.length > 0 ? true : undefined
									}
								/>
								{field.state.meta.errors.map((error) => (
									<FormMessage key={error?.message} id={`${field.name}-error`}>
										{error?.message}
									</FormMessage>
								))}
							</div>
						)}
					</form.Field>

					{/* Description */}
					<form.Field name="description">
						{(field) => (
							<div className="shrink-0 space-y-2">
								<Label htmlFor={field.name}>Description</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Optional description for this group"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									rows={2}
									disabled={isPending}
								/>
							</div>
						)}
					</form.Field>

					{/* Color */}
					<form.Field name="color">
						{(field) => (
							<div className="shrink-0 space-y-2">
								<Label htmlFor={field.name}>Color</Label>
								<ColorPicker
									value={field.state.value}
									onChange={field.handleChange}
									disabled={isPending}
								/>
							</div>
						)}
					</form.Field>

					{/* Items selection */}
					<form.Field name="selectedItemIds">
						{(field) => {
							const selectedSet = new Set(field.state.value);
							return (
								<div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden">
									<Label className="shrink-0">
										Select {labels.entityPlural} ({selectedSet.size} selected)
									</Label>
									<div className="max-h-[300px] flex-1 overflow-y-auto rounded-md border">
										<div className="space-y-2 p-4">
											{items.map((item) => {
												const isSelected = selectedSet.has(item.id);
												return (
													<div
														key={item.id}
														className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent/50"
													>
														<Checkbox
															checked={isSelected}
															onCheckedChange={() => {
																handleToggleItem(item.id);
															}}
															disabled={isPending}
														/>
														<div
															className="h-3 w-3 shrink-0 rounded-full"
															style={{
																backgroundColor:
																	item.color || labels.defaultColor,
															}}
														/>
														<div className="min-w-0 flex-1">
															<p className="truncate font-medium text-sm">
																{item.name}
															</p>
															<p className="text-muted-foreground text-xs">
																{item.count} {labels.subItemPlural}
																{item.count !== 1 ? "" : ""}
															</p>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</div>
							);
						}}
					</form.Field>

					{/* Actions */}
					<div className="flex justify-end gap-2 border-t pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button type="submit" disabled={isPending || !canSubmit}>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{isEditMode ? "Updating..." : "Creating..."}
										</>
									) : isEditMode ? (
										"Update"
									) : (
										"Create"
									)}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
