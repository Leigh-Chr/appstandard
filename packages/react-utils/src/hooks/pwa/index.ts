/**
 * PWA hooks exports
 * Provides React hooks for Progressive Web App features
 */
// biome-ignore lint/performance/noBarrelFile: intentional module organization for PWA hooks

// App Badge API
export { clearAppBadge, setAppBadge, useBadge } from "./use-badge";

// Contact Picker API
export type {
	Contact,
	ContactAddress,
	ContactPickerOptions,
	ContactProperty,
	UseContactPickerReturn,
} from "./use-contact-picker";
export {
	isContactPickerSupported,
	useContactPicker,
} from "./use-contact-picker";

// Content Indexing API
export type {
	ContentCategory,
	ContentDescription,
	UseContentIndexReturn,
} from "./use-content-index";
export {
	indexCalendarEvent,
	indexContact,
	indexTask,
	removeFromIndex,
	useContentIndex,
} from "./use-content-index";

// Display Mode
export type { DisplayMode, UseDisplayModeReturn } from "./use-display-mode";
export {
	isAppInstalled,
	isWindowControlsOverlayActive,
	useDisplayMode,
} from "./use-display-mode";

// File Handler API
export type { FileHandlerOptions } from "./use-file-handler";
export {
	isFileHandlerSupported,
	readFileAsText,
	readFilesAsText,
	useFileHandler,
} from "./use-file-handler";

// Install Prompt
export type { UseInstallPromptReturn } from "./use-install-prompt";
export {
	isAppInstalled as isInstalled,
	useInstallPrompt,
} from "./use-install-prompt";

// Web Share API
export type { ShareData, UseShareReturn } from "./use-share";
export { shareContent, shareFile, useShare } from "./use-share";
