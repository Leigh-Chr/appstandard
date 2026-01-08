/**
 * Account prompt for Calendar app
 * Uses shared AccountPrompt component with calendar-specific configuration
 */

import {
	type AccountPromptConfig,
	type AccountPromptUsage,
	AccountPrompt as SharedAccountPrompt,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-storage";
import { trpc } from "@/utils/trpc";

const CALENDAR_CONFIG: AccountPromptConfig = {
	entityNamePlural: "calendars",
	entityIcon: Calendar,
	maxLimitLabel: "100 calendars",
	syncMessage: "Sync your calendars across all your devices",
	keepSafeTitle: "Keep your calendars safe",
	backupDescription: "Back up your calendars in the cloud",
};

interface AccountPromptProps {
	variant?: "banner" | "card";
	showUsage?: boolean;
	dismissible?: boolean;
}

export function AccountPrompt({
	variant = "banner",
	showUsage = true,
	dismissible = true,
}: AccountPromptProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();

	const { data: rawUsage } = useQuery({
		...trpc.calendar.getUsage.queryOptions(),
		enabled: !isAuthenticated && showUsage,
	});

	// Transform to normalized usage format
	const usage: AccountPromptUsage | undefined = rawUsage
		? {
				collectionCount: rawUsage.calendarCount,
				maxCollections: rawUsage.maxCalendars,
				itemCounts: rawUsage.eventCounts,
				maxItemsPerCollection: rawUsage.maxEventsPerCalendar,
			}
		: undefined;

	const handleSignup = () => {
		navigate({
			to: "/login",
			search: { mode: "signup", redirect: location.pathname },
		});
	};

	return (
		<SharedAccountPrompt
			config={CALENDAR_CONFIG}
			usage={usage}
			isAuthenticated={isAuthenticated}
			variant={variant}
			showUsage={showUsage}
			dismissible={dismissible}
			onSignup={handleSignup}
		/>
	);
}
