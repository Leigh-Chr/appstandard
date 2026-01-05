/**
 * Application context for shared configuration
 * Allows apps to provide app-specific settings to shared components
 */

import type { LucideIcon } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

export interface AppConfig {
	/** App name (e.g., "AppStandard Calendar", "AppStandard Tasks", "AppStandard Contacts") */
	appName: string;
	/** Short app name for UI (e.g., "calendars", "tasks", "contacts") */
	appSlug: string;
	/** Icon component for the app (e.g., Calendar, CheckSquare, Contact) */
	appIcon: LucideIcon;
	/** Base URL for SEO meta tags (e.g., "https://appstandard.app") */
	baseUrl: string;
	/** Main route for the app (e.g., "/calendars", "/tasks", "/contacts") */
	mainRoute: string;
	/** Protected route prefix to check during logout (e.g., "/calendars", "/tasks") */
	protectedRoutePrefix: string;
	/** Label for the main link (e.g., "My calendars", "My tasks", "My contacts") */
	mainLabel: string;
	/** Label for import action (e.g., "Import a .ics", "Import tasks", "Import contacts") */
	importLabel: string;
	/** Label for new item action (e.g., "New calendar", "New task", "New contact") */
	newLabel: string;
	/** Short description for footer */
	description: string;
	/** Singular entity name for resources (e.g., "Calendar", "Task", "Contact") */
	entityName: string;
}

// We'll use a placeholder that apps must override
const defaultConfig: AppConfig = {
	appName: "App",
	appSlug: "app",
	appIcon: null as unknown as LucideIcon, // Must be provided by app
	baseUrl: "",
	mainRoute: "/",
	protectedRoutePrefix: "/",
	mainLabel: "Home",
	importLabel: "Import",
	newLabel: "New",
	description: "Open-source application",
	entityName: "Item",
};

const AppContext = createContext<AppConfig>(defaultConfig);

export interface AppProviderProps {
	children: ReactNode;
	config: AppConfig;
}

export function AppProvider({ children, config }: AppProviderProps) {
	return <AppContext.Provider value={config}>{children}</AppContext.Provider>;
}

export function useAppConfig(): AppConfig {
	return useContext(AppContext);
}
