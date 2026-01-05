/**
 * Bulk actions toolbar for selected calendars
 * Wrapper around shared BulkActionsBar component
 */

import { BulkActionsBar } from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { ShareCalendarsDialog } from "@/components/share-calendars-dialog";
import { exportCalendarsAsICSFile } from "@/lib/calendar-export";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";
import { CreateGroupDialog } from "./create-group-dialog";

interface CalendarBulkActionsBarProps {
	selectedCount: number;
	totalCount: number;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onExitSelectionMode: () => void;
	selectedIds: Set<string>;
}

export function CalendarBulkActionsBar({
	selectedCount,
	totalCount,
	onSelectAll,
	onDeselectAll,
	onExitSelectionMode,
	selectedIds,
}: CalendarBulkActionsBarProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation(
		trpc.calendar.bulkDelete.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.event.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(`${data.deletedCount} calendar(s) deleted`);
				onExitSelectionMode();
			},
			onError: (error) => {
				toast.error(error.message || "Error during deletion");
			},
		}),
	);

	const handleDeleteConfirm = useCallback(() => {
		bulkDeleteMutation.mutate({ calendarIds: Array.from(selectedIds) });
	}, [bulkDeleteMutation, selectedIds]);

	const handleMerge = useCallback(() => {
		const selectedStr = Array.from(selectedIds).join(",");
		navigate({
			to: "/calendars/merge",
			search: { selected: selectedStr },
		});
		onExitSelectionMode();
	}, [navigate, selectedIds, onExitSelectionMode]);

	const handleExport = useCallback(async () => {
		if (selectedIds.size === 0) return;
		try {
			await exportCalendarsAsICSFile(Array.from(selectedIds));
			toast.success("Calendars exported successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to export calendars",
			);
		}
	}, [selectedIds]);

	return (
		<BulkActionsBar
			labels={{
				entitySingular: "calendar",
				entityPlural: "calendars",
				subItemPlural: "events",
			}}
			selectedCount={selectedCount}
			totalCount={totalCount}
			selectedIds={selectedIds}
			isDeleting={bulkDeleteMutation.isPending}
			onSelectAll={onSelectAll}
			onDeselectAll={onDeselectAll}
			onExitSelectionMode={onExitSelectionMode}
			onDeleteConfirm={handleDeleteConfirm}
			onMerge={handleMerge}
			onExport={handleExport}
			renderShareDialog={({ open, onOpenChange }) => (
				<ShareCalendarsDialog
					calendarIds={Array.from(selectedIds)}
					open={open}
					onOpenChange={onOpenChange}
				/>
			)}
			renderCreateGroupDialog={({ open, onOpenChange }) => (
				<CreateGroupDialog
					open={open}
					onOpenChange={onOpenChange}
					initialCalendarIds={Array.from(selectedIds)}
				/>
			)}
		/>
	);
}
