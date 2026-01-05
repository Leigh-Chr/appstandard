/**
 * Share calendars dialog
 * Wrapper around shared ShareBundleDialog component
 */

import {
	type SelectedItem,
	type ShareBundle,
	ShareBundleDialog,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface ShareCalendarsDialogProps {
	calendarIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Optional group ID to link the bundle to a group */
	groupId?: string | undefined;
}

export function ShareCalendarsDialog({
	calendarIds,
	open,
	onOpenChange,
	groupId,
}: ShareCalendarsDialogProps) {
	const queryClient = useQueryClient();

	// Get calendars info for display
	const { data: calendarsData } = useQuery({
		...trpc.calendar.list.queryOptions(),
		enabled: open,
	});

	const calendars = calendarsData?.calendars || [];
	const selectedCalendars = calendars.filter((cal) =>
		calendarIds.includes(cal.id),
	);

	// Map to SelectedItem format
	const selectedItems: SelectedItem[] = selectedCalendars.map((cal) => ({
		id: cal.id,
		name: cal.name,
		color: cal.color,
		count: cal.eventCount,
	}));

	// Query existing share bundles
	const { data: shareBundlesData, isLoading } = useQuery({
		...trpc.share.bundle.list.queryOptions(),
		enabled: open,
	});

	// Map to ShareBundle format
	const shareBundles: ShareBundle[] | undefined = shareBundlesData?.map(
		(bundle) => ({
			id: bundle.id,
			name: bundle.name,
			token: bundle.token,
			itemCount: bundle.calendarCount,
			isActive: bundle.isActive,
			removeDuplicates: bundle.removeDuplicates,
			accessCount: bundle.accessCount,
			lastAccessedAt: bundle.lastAccessedAt,
			createdAt: bundle.createdAt,
		}),
	);

	// Create share bundle mutation
	const createMutation = useMutation(
		trpc.share.bundle.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Sharing bundle created");
			},
			onError: (error) => {
				toast.error(error.message || "Error during bundle creation");
			},
		}),
	);

	// Update share bundle mutation
	const updateMutation = useMutation(
		trpc.share.bundle.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				toast.error(error.message || "Error during update");
			},
		}),
	);

	// Delete share bundle mutation
	const deleteMutation = useMutation(
		trpc.share.bundle.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Sharing bundle deleted");
			},
			onError: (error) => {
				toast.error(error.message || "Error during deletion");
			},
		}),
	);

	const handleCreate = (name: string, removeDuplicates: boolean) => {
		if (calendarIds.length === 0 && !groupId) {
			toast.error("Please select at least one calendar");
			return;
		}

		createMutation.mutate({
			...(groupId ? { groupId } : { calendarIds }),
			name: name || undefined,
			removeDuplicates,
		});
	};

	const handleToggleActive = (bundleId: string, isActive: boolean) => {
		updateMutation.mutate({ id: bundleId, isActive });
	};

	const handleDelete = (bundleId: string) => {
		deleteMutation.mutate({ id: bundleId });
	};

	return (
		<ShareBundleDialog
			labels={{
				entitySingular: "calendar",
				entityPlural: "calendars",
				subItemPlural: "events",
				fileExtension: ".ics",
				defaultColor: "#D4A017",
			}}
			itemIds={calendarIds}
			open={open}
			onOpenChange={onOpenChange}
			groupId={groupId}
			selectedItems={selectedItems}
			shareBundles={shareBundles}
			isLoading={isLoading}
			isCreating={createMutation.isPending}
			isUpdating={updateMutation.isPending}
			isDeleting={deleteMutation.isPending}
			onCreate={handleCreate}
			onToggleActive={handleToggleActive}
			onDelete={handleDelete}
		/>
	);
}
