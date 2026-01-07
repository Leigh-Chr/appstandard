/**
 * @appstandard/ui
 * Shared UI components for AppStandard suite applications
 */

// Account Components
export {
	DeleteAccountForm,
	type DeleteAccountFormProps,
	EditProfileForm,
	type EditProfileFormProps,
	ExportDataButton,
	type ExportDataButtonProps,
	UserMenu,
	type UserMenuProps,
} from "./account";
// Alert
export { Alert, AlertDescription, AlertTitle } from "./alert";
// Alert Dialog
export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./alert-dialog";
// Animations
export {
	AnimatedListItem,
	type AnimationType,
	PageTransition,
	Presence,
	ScaleFade,
	SlideFromRight,
	StaggerContainer,
	StaggerItem,
	SuccessAnimation,
	type SuccessAnimationProps,
	useSuccessAnimation,
} from "./animations";
// App Context
export {
	type AppConfig,
	AppProvider,
	type AppProviderProps,
	useAppConfig,
} from "./app-context";
// App Footer
export { AppFooter } from "./app-footer";
// App Header
export {
	AppHeader,
	type AppHeaderProps,
	OPEN_COMMAND_PALETTE_EVENT,
	OPEN_CREATE_GROUP_EVENT,
	OPEN_KEYBOARD_SHORTCUTS_EVENT,
	openCommandPalette,
	openCreateGroup,
	openKeyboardShortcuts,
} from "./app-header";
// Auth Forms
export {
	// Types
	type AuthClient,
	type BaseAuthFormProps,
	ChangePasswordForm,
	type ChangePasswordFormProps,
	CheckEmailPage,
	type CheckEmailPageProps,
	// Password Management
	ForgotPasswordForm,
	type ForgotPasswordFormProps,
	type NavigateFunction,
	ResendVerificationForm,
	type ResendVerificationFormProps,
	ResetPasswordForm,
	type ResetPasswordFormProps,
	// Sign In / Sign Up
	SignInForm,
	type SignInFormProps,
	SignUpForm,
	type SignUpFormProps,
	type UseSearchFunction,
	// Email Verification
	VerifyEmailPage,
	type VerifyEmailPageProps,
} from "./auth";
// Badge
export { Badge } from "./badge";
// Breadcrumb
export {
	Breadcrumb,
	// Primitives for custom usage
	BreadcrumbEllipsis,
	type BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbListItem,
	BreadcrumbPage,
	type BreadcrumbProps,
	BreadcrumbRoot,
	BreadcrumbSeparator,
} from "./breadcrumb";
// Button
export { Button, buttonVariants } from "./button";
// Calendar
export { Calendar } from "./calendar";
// Card
export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";
// Checkbox
export { Checkbox } from "./checkbox";
// Collapsible
export {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./collapsible";
// Collection Management Components
export {
	BulkActionsBar,
	type BulkActionsBarLabels,
	type BulkActionsBarProps,
	CreateGroupDialog,
	type CreateGroupDialogLabels,
	type CreateGroupDialogProps,
	type GroupMember,
	GroupMembersList,
	type GroupMembersListLabels,
	type GroupMembersListProps,
	type GroupToEdit,
	InviteGroupMemberDialog,
	type InviteGroupMemberDialogProps,
	ListHeader,
	type ListHeaderItem,
	type ListHeaderLabels,
	type ListHeaderProps,
	ListLoadingState,
	type ListLoadingStateProps,
	type SelectableItem,
	type SelectedItem,
	type ShareBundle,
	ShareBundleDialog,
	type ShareBundleDialogLabels,
	type ShareBundleDialogProps,
} from "./collections";
// Color Picker
export { ColorPicker } from "./color-picker";
// Command
export {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "./command";
// Dashboard Components
export {
	// Breakdown Chart
	BreakdownChart,
	type BreakdownChartProps,
	type BreakdownItem,
	CHART_COLORS,
	// Empty States
	DashboardEmptyState,
	type DashboardEmptyStateAction,
	type DashboardEmptyStateProps,
	EMPTY_STATE_CONFIGS,
	// Metric Card
	formatVariation,
	// Insight Card
	InsightCard,
	type InsightCardProps,
	InsightList,
	type InsightListItem,
	type InsightListProps,
	InsightProgress,
	type InsightProgressProps,
	InsightStat,
	type InsightStatProps,
	MetricCard,
	type MetricCardProps,
	NextItemCard,
	type NextItemCardProps,
	NoDataMessage,
	type NoDataMessageProps,
	PERIOD_OPTIONS,
	// Period Selector
	type Period,
	PeriodSelector,
	type PeriodSelectorProps,
	PositiveMessage,
	type PositiveMessageProps,
	// Quick Actions
	type QuickAction,
	QuickActions,
	type QuickActionsProps,
	SmallEmptyState,
	type SmallEmptyStateProps,
	StatusBarChart,
	type StatusBarChartProps,
	type StatusBarItem,
	VariationBadge,
	type VariationBadgeProps,
	type VariationData,
	WarningMessage,
	type WarningMessageProps,
} from "./dashboard";
// Dialog
export {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";
// Dropdown Menu
export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
// Empty State
export {
	EmptyListIllustration,
	EmptySearchIllustration,
	EmptyState,
	type EmptyStateAction,
	type EmptyStateProps,
	ImportFileIllustration,
	SuccessIllustration,
} from "./empty-state";
// Error Boundary
export {
	ErrorBoundary,
	type ErrorBoundaryLogger,
	type SentryLike,
} from "./error-boundary";
// File Drop Zone
export {
	type DropState,
	FileDropZone,
	type FileDropZoneProps,
	type FileValidationResult,
} from "./file-drop-zone";
// Form Components
export {
	CollapsibleSection,
	type CollapsibleSectionProps,
	MobileFormProgress,
	type MobileFormProgressProps,
} from "./form";
// Form Message
export { FormMessage, type FormMessageProps } from "./form-message";
// Hooks
export {
	buildCommonShortcuts,
	type CommonShortcutHandlers,
	groupShortcutsByCategory,
	type KeyboardShortcut,
	SHORTCUT_CATEGORIES,
	type ShortcutHelpCategory,
	type ShortcutHelpItem,
	type UseKeyboardShortcutsOptions,
	type UseKeyboardShortcutsReturn,
	useKeyboardShortcuts,
} from "./hooks";
// Hover Card
export { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
// Input
export { Input } from "./input";
// Keyboard Shortcuts Dialog
export {
	KeyboardShortcutsDialog,
	type KeyboardShortcutsDialogProps,
} from "./keyboard-shortcuts-dialog";
// Label
export { Label } from "./label";
// Loader
export { Loader, type LoaderProps } from "./loader";
// Mode Toggle
export { ModeToggle } from "./mode-toggle";
// Popover
export {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./popover";
// Progress
export { Progress } from "./progress";
// PWA Update Prompt
export {
	checkForPWAUpdates,
	type PWALogger,
	PWAUpdatePrompt,
	type PWAUpdatePromptProps,
	type RegisterSWFunction,
	type RegisterSWOptions,
} from "./pwa-update-prompt";
// Radio Group
export { RadioGroup, RadioGroupItem } from "./radio-group";
// Scroll Area
export { ScrollArea, ScrollBar } from "./scroll-area";
// Select
export {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";
// Separator
export { Separator } from "./separator";
// Skeleton
export { Skeleton } from "./skeleton";
// Slider
export { Slider } from "./slider";
// Sonner (Toast)
export { Toaster } from "./sonner";
// Switch
export { Switch } from "./switch";
// Tabs
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
// Tag Input
export { TagInput } from "./tag-input";
// Textarea
export { Textarea } from "./textarea";
// Theme Provider
export { ThemeProvider, useTheme } from "./theme-provider";
// Tooltip
export {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip";
// Tour
export {
	Tour,
	type TourContextValue,
	type TourProps,
	TourProvider,
	type TourStep,
	TourTooltip,
	type TourTooltipProps,
	useTour,
} from "./tour";
