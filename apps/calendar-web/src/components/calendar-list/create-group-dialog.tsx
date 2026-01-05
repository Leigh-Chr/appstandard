/**
 * Create/Edit Calendar Group Dialog
 * Wrapper around shared CreateGroupDialog component
 */

import {
	CreateGroupDialog,
	type GroupToEdit,
	type SelectableItem,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface CalendarCreateGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-selected calendar IDs (for creating from selection) */
	initialCalendarIds?: string[];
	/** Group to edit (if provided, dialog is in edit mode) */
	groupToEdit?: {
		id: string;
		name: string;
		description?: string | null;
		color?: string | null;
	};
}

export function CalendarCreateGroupDialog({
	open,
	onOpenChange,
	initialCalendarIds = [],
	groupToEdit,
}: CalendarCreateGroupDialogProps) {
	const queryClient = useQueryClient();

	// Get all calendars
	const { data: calendarsData } = useQuery({
		...trpc.calendar.list.queryOptions(),
		enabled: open,
	});

	const calendars = calendarsData?.calendars || [];

	// Map to SelectableItem format
	const items: SelectableItem[] = calendars.map((cal) => ({
		id: cal.id,
		name: cal.name,
		color: cal.color,
		count: cal.eventCount,
	}));

	// Get group details if editing
	const { data: groupDetails } = useQuery({
		...trpc.calendar.group.getById.queryOptions({ id: groupToEdit?.id || "" }),
		enabled: open && !!groupToEdit?.id,
	});

	// Get current item IDs from group details
	const currentItemIds =
		groupDetails?.calendars?.map((c: { id: string }) => c.id) || [];

	// Map groupToEdit to GroupToEdit format
	const mappedGroupToEdit: GroupToEdit | undefined = groupToEdit
		? {
				id: groupToEdit.id,
				name: groupToEdit.name,
				description: groupToEdit.description,
				color: groupToEdit.color,
			}
		: undefined;

	// Create mutation
	const createMutation = useMutation(
		trpc.calendar.group.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group created successfully");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error creating group");
			},
		}),
	);

	// Update mutation
	const updateMutation = useMutation(
		trpc.calendar.group.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group updated successfully");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error updating group");
			},
		}),
	);

	// Add calendars mutation
	const addCalendarsMutation = useMutation(
		trpc.calendar.group.addCalendars.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.all,
				});
				toast.success("Calendars added to group");
			},
			onError: (error) => {
				toast.error(error.message || "Error adding calendars");
			},
		}),
	);

	// Remove calendars mutation
	const removeCalendarsMutation = useMutation(
		trpc.calendar.group.removeCalendars.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.all,
				});
				toast.success("Calendars removed from group");
			},
			onError: (error) => {
				toast.error(error.message || "Error removing calendars");
			},
		}),
	);

	const handleCreate = (data: {
		name: string;
		description: string | undefined;
		color: string | undefined;
		itemIds: string[];
	}) => {
		createMutation.mutate({
			name: data.name,
			description: data.description,
			color: data.color,
			calendarIds: data.itemIds,
		});
	};

	const handleUpdate = (data: {
		id: string;
		name: string;
		description: string | null;
		color: string | null;
		addItemIds: string[];
		removeItemIds: string[];
	}) => {
		// Update group metadata
		updateMutation.mutate({
			id: data.id,
			name: data.name,
			description: data.description,
			color: data.color,
		});

		// Add new calendars
		if (data.addItemIds.length > 0) {
			addCalendarsMutation.mutate({
				id: data.id,
				calendarIds: data.addItemIds,
			});
		}

		// Remove calendars
		if (data.removeItemIds.length > 0) {
			removeCalendarsMutation.mutate({
				id: data.id,
				calendarIds: data.removeItemIds,
			});
		}
	};

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		addCalendarsMutation.isPending ||
		removeCalendarsMutation.isPending;

	return (
		<CreateGroupDialog
			labels={{
				entitySingular: "calendar",
				entityPlural: "calendars",
				subItemPlural: "event",
				defaultColor: "#D4A017",
				namePlaceholder: "Work calendars, Personal",
			}}
			open={open}
			onOpenChange={onOpenChange}
			items={items}
			initialItemIds={initialCalendarIds}
			groupToEdit={mappedGroupToEdit}
			currentItemIds={currentItemIds}
			isPending={isPending}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
		/>
	);
}

// Re-export for backwards compatibility
export { CalendarCreateGroupDialog as CreateGroupDialog };
