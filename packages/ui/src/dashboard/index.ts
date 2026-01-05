/**
 * Dashboard Components
 * Shared dashboard components for AppStandard suite applications
 */

// Breakdown Chart
export {
	BreakdownChart,
	type BreakdownChartProps,
	type BreakdownItem,
	CHART_COLORS,
	StatusBarChart,
	type StatusBarChartProps,
	type StatusBarItem,
} from "./breakdown-chart";

// Empty States
export {
	DashboardEmptyState,
	type DashboardEmptyStateAction,
	type DashboardEmptyStateProps,
	EMPTY_STATE_CONFIGS,
	NoDataMessage,
	type NoDataMessageProps,
	PositiveMessage,
	type PositiveMessageProps,
	SmallEmptyState,
	type SmallEmptyStateProps,
	WarningMessage,
	type WarningMessageProps,
} from "./empty-states";

// Insight Card
export {
	InsightCard,
	type InsightCardProps,
	InsightList,
	type InsightListItem,
	type InsightListProps,
	InsightProgress,
	type InsightProgressProps,
	InsightStat,
	type InsightStatProps,
} from "./insight-card";

// Metric Card
export {
	formatVariation,
	MetricCard,
	type MetricCardProps,
	NextItemCard,
	type NextItemCardProps,
	VariationBadge,
	type VariationBadgeProps,
	type VariationData,
} from "./metric-card";

// Period Selector
export {
	PERIOD_OPTIONS,
	type Period,
	PeriodSelector,
	type PeriodSelectorProps,
} from "./period-selector";

// Quick Actions
export {
	type QuickAction,
	QuickActions,
	type QuickActionsProps,
} from "./quick-actions";
