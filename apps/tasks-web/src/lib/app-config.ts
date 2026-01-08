/**
 * Application configuration for AppStandard Tasks
 * Centralized config used by shared UI components
 */

import type { AppConfig } from "@appstandard/ui";
import { CheckSquare } from "lucide-react";

export const APP_CONFIG: AppConfig = {
	appName: "AppStandard Tasks",
	appSlug: "tasks",
	appIcon: CheckSquare,
	baseUrl: "https://tasks.appstandard.io",
	mainRoute: "/tasks",
	protectedRoutePrefix: "/tasks",
	mainLabel: "My tasks",
	importLabel: "Import tasks",
	newLabel: "New task",
	description:
		"Free, open-source task management. Create, organize, and track your todos—no complexity, no vendor lock-in.",
	entityName: "Task",
};
