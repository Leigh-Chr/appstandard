/**
 * Application configuration for AppStandard Calendar
 * Centralized config used by shared UI components
 */

import type { AppConfig } from "@appstandard/ui";
import { Calendar } from "lucide-react";

export const APP_CONFIG: AppConfig = {
	appName: "AppStandard Calendar",
	appSlug: "calendars",
	appIcon: Calendar,
	baseUrl: "https://appstandard.app",
	mainRoute: "/calendars",
	protectedRoutePrefix: "/calendars",
	mainLabel: "My calendars",
	importLabel: "Import a .ics",
	newLabel: "New calendar",
	description:
		"Free, open-source calendar management. Import, create, edit, and merge your calendars—no complexity, no vendor lock-in.",
	entityName: "Calendar",
};
