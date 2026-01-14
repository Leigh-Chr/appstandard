/**
 * Application configuration for AppStandard Contacts
 * Centralized config used by shared UI components
 */

import type { AppConfig } from "@appstandard/ui";
import { Contact } from "lucide-react";

export const APP_CONFIG: AppConfig = {
	appName: "AppStandard Contacts",
	appSlug: "contacts",
	appIcon: Contact,
	logoSrc: "/logo.png",
	baseUrl: "https://contacts.appstandard.io",
	mainRoute: "/contacts",
	protectedRoutePrefix: "/contacts",
	mainLabel: "My contacts",
	importLabel: "Import contacts",
	newLabel: "New contact",
	description:
		"Free, open-source contact management. Import, create, edit, and organize your vCard contacts—no complexity, no vendor lock-in.",
	entityName: "Contact",
};
