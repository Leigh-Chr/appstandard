/**
 * Unified storage hook for authenticated and anonymous users
 */

import { authClient } from "@appstandard/react-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleTRPCError } from "@/lib/error-handler";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
	const session = authClient.useSession();
	return !!session.data;
}

/**
 * Hook to get calendars (works for both authenticated and anonymous users)
 * Note: Anonymous users' calendars are stored server-side, not in localStorage
 */
export function useCalendars(filterGroups?: string[]) {
	// Use tRPC for both authenticated and anonymous users
	// The anonymous ID is sent via header in trpc.ts
	const trpcCalendars = useQuery({
		...trpc.calendar.list.queryOptions(
			filterGroups && filterGroups.length > 0 ? { filterGroups } : undefined,
		),
		enabled: true, // Always enabled - works for both authenticated and anonymous
	});

	return {
		calendars: trpcCalendars.data?.calendars || [],
		isLoading: trpcCalendars.isLoading,
		isError: trpcCalendars.isError,
	};
}

/**
 * Hook to get a single calendar
 */
export function useCalendar(calendarId: string | undefined) {
	const trpcCalendar = useQuery({
		...trpc.calendar.getById.queryOptions({ id: calendarId ?? "" }),
		enabled: !!calendarId,
	});

	// For anonymous users, we use tRPC with anonymous header
	return {
		calendar: trpcCalendar.data,
		isLoading: trpcCalendar.isLoading,
		isError: trpcCalendar.isError,
	};
}

/**
 * Hook to create a calendar
 */
export function useCreateCalendar() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.calendar.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error creating calendar",
					fallbackDescription:
						"Unable to create the calendar. Please try again.",
				});
			},
		}),
	);

	return {
		createCalendar: mutation.mutate,
		isCreating: mutation.isPending,
	};
}

/**
 * Hook to update a calendar
 */
export function useUpdateCalendar() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.calendar.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Calendar updated");
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error updating",
					fallbackDescription:
						"Unable to update the calendar. Please try again.",
				});
			},
		}),
	);

	return {
		updateCalendar: mutation.mutate,
		isUpdating: mutation.isPending,
	};
}

/**
 * Hook to delete a calendar with undo capability
 */
export function useDeleteCalendar() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.calendar.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error deleting",
					fallbackDescription:
						"Unable to delete the calendar. Please try again.",
				});
			},
		}),
	);

	const deleteWithUndo = (params: { id: string; name?: string }) => {
		let cancelled = false;
		const toastId = toast("Calendar deleted", {
			description: params.name
				? `"${params.name}" has been deleted`
				: undefined,
			action: {
				label: "Undo",
				onClick: () => {
					cancelled = true;
					toast.dismiss(toastId);
					toast.success("Deletion cancelled");
				},
			},
			duration: 5000,
			onAutoClose: () => {
				if (!cancelled) {
					mutation.mutate({ id: params.id });
				}
			},
		});
	};

	return {
		deleteCalendar: deleteWithUndo,
		isDeleting: mutation.isPending,
	};
}
