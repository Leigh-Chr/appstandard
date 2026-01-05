/**
 * Dashboard hooks for AppStandard Contacts
 * Follows AppStandard Calendar patterns for consistency
 */

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

type Period = "today" | "week" | "month" | "year";

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboard(period: Period = "week") {
	const trpcDashboard = useQuery({
		...trpc.dashboard.getStats.queryOptions({ period }),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		stats: trpcDashboard.data,
		isLoading: trpcDashboard.isLoading,
		isError: trpcDashboard.isError,
	};
}
