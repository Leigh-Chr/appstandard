/**
 * Account prompt for Tasks app
 * Uses shared AccountPrompt component with tasks-specific configuration
 */

import {
	type AccountPromptConfig,
	type AccountPromptUsage,
	AccountPrompt as SharedAccountPrompt,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-storage";
import { trpc } from "@/utils/trpc";

const TASKS_CONFIG: AccountPromptConfig = {
	entityNamePlural: "task lists",
	entityIcon: CheckSquare,
	maxLimitLabel: "100 task lists",
	syncMessage: "Sync your tasks across all your devices",
	keepSafeTitle: "Keep your tasks safe",
	backupDescription: "Back up your task lists in the cloud",
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
		...trpc.taskList.getUsage.queryOptions(),
		enabled: !isAuthenticated && showUsage,
	});

	// Transform to normalized usage format
	const usage: AccountPromptUsage | undefined = rawUsage
		? {
				collectionCount: rawUsage.taskListCount,
				maxCollections: rawUsage.maxTaskLists,
				itemCounts: rawUsage.taskCounts,
				maxItemsPerCollection: rawUsage.maxTasksPerTaskList,
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
			config={TASKS_CONFIG}
			usage={usage}
			isAuthenticated={isAuthenticated}
			variant={variant}
			showUsage={showUsage}
			dismissible={dismissible}
			onSignup={handleSignup}
		/>
	);
}
