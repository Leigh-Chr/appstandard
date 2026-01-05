/**
 * Task list filter components
 */

import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";

// ----- Types -----

export type TaskStatusFilter =
	| "all"
	| "needs-action"
	| "in-progress"
	| "completed"
	| "cancelled";
export type TaskPriorityFilter = "all" | "high" | "medium" | "low";
export type TaskSortBy = "dueDate" | "created" | "priority" | "title";
export type SortDirection = "asc" | "desc";

export interface TaskFilterState {
	search: string;
	status: TaskStatusFilter;
	priority: TaskPriorityFilter;
	sortBy: TaskSortBy;
	sortDirection: SortDirection;
}

export const INITIAL_TASK_FILTER_STATE: TaskFilterState = {
	search: "",
	status: "all",
	priority: "all",
	sortBy: "dueDate",
	sortDirection: "asc",
};

// ----- Status Filter Buttons -----

interface StatusFilterButtonsProps {
	currentFilter: TaskStatusFilter;
	onFilterChange: (filter: TaskStatusFilter) => void;
}

const STATUS_FILTER_LABELS: Record<TaskStatusFilter, string> = {
	all: "All",
	"needs-action": "To Do",
	"in-progress": "In Progress",
	completed: "Done",
	cancelled: "Cancelled",
};

export function StatusFilterButtons({
	currentFilter,
	onFilterChange,
}: StatusFilterButtonsProps) {
	return (
		<div
			className="flex flex-wrap gap-2"
			role="group"
			aria-label="Filter tasks by status"
		>
			{(Object.keys(STATUS_FILTER_LABELS) as TaskStatusFilter[]).map(
				(filter) => (
					<Button
						key={filter}
						variant={currentFilter === filter ? "default" : "outline"}
						size="sm"
						onClick={() => onFilterChange(filter)}
						aria-pressed={currentFilter === filter}
						aria-label={`Show ${STATUS_FILTER_LABELS[filter].toLowerCase()} tasks`}
					>
						{STATUS_FILTER_LABELS[filter]}
					</Button>
				),
			)}
		</div>
	);
}

// ----- Priority Filter -----

interface PriorityFilterProps {
	currentFilter: TaskPriorityFilter;
	onFilterChange: (filter: TaskPriorityFilter) => void;
}

const PRIORITY_LABELS: Record<TaskPriorityFilter, string> = {
	all: "All Priorities",
	high: "High Priority",
	medium: "Medium Priority",
	low: "Low Priority",
};

export function PriorityFilter({
	currentFilter,
	onFilterChange,
}: PriorityFilterProps) {
	return (
		<Select value={currentFilter} onValueChange={onFilterChange}>
			<SelectTrigger className="w-[160px]">
				<SelectValue placeholder="Priority" />
			</SelectTrigger>
			<SelectContent>
				{(Object.keys(PRIORITY_LABELS) as TaskPriorityFilter[]).map(
					(filter) => (
						<SelectItem key={filter} value={filter}>
							{PRIORITY_LABELS[filter]}
						</SelectItem>
					),
				)}
			</SelectContent>
		</Select>
	);
}

// ----- Search and Sort Bar -----

interface TaskSearchSortBarProps {
	search: string;
	sortBy: TaskSortBy;
	sortDirection: SortDirection;
	onSearchChange: (search: string) => void;
	onSortChange: (sortBy: TaskSortBy) => void;
	onSortDirectionChange: (direction: SortDirection) => void;
}

const SORT_LABELS: Record<TaskSortBy, string> = {
	dueDate: "Due Date",
	created: "Created",
	priority: "Priority",
	title: "Title A-Z",
};

export function TaskSearchSortBar({
	search,
	sortBy,
	sortDirection,
	onSearchChange,
	onSortChange,
	onSortDirectionChange,
}: TaskSearchSortBarProps) {
	const handleDirectionToggle = () => {
		onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
	};

	return (
		<div className="flex flex-col gap-2 sm:flex-row">
			<div className="flex-1">
				<div className="relative">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search tasks..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pr-9 pl-9"
						aria-label="Search tasks by title or description"
					/>
					{search && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-1/2 right-1 h-8 min-h-[44px] w-8 -translate-y-1/2 sm:h-6 sm:min-h-0 sm:w-6"
							onClick={() => onSearchChange("")}
							aria-label="Clear search"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Select
					value={sortBy}
					onValueChange={(v) => onSortChange(v as TaskSortBy)}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(SORT_LABELS) as TaskSortBy[]).map((sort) => (
							<SelectItem key={sort} value={sort}>
								{SORT_LABELS[sort]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					size="icon"
					onClick={handleDirectionToggle}
					className="w-[40px]"
					aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
					title={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
				>
					{sortDirection === "asc" ? (
						<ArrowUp className="h-4 w-4" />
					) : (
						<ArrowDown className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

// ----- Combined Filter Bar -----

interface TaskFilterBarProps {
	filters: TaskFilterState;
	onFiltersChange: (filters: Partial<TaskFilterState>) => void;
}

export function TaskFilterBar({
	filters,
	onFiltersChange,
}: TaskFilterBarProps) {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3">
				<StatusFilterButtons
					currentFilter={filters.status}
					onFilterChange={(status) => onFiltersChange({ status })}
				/>
				<PriorityFilter
					currentFilter={filters.priority}
					onFilterChange={(priority) => onFiltersChange({ priority })}
				/>
			</div>
			<TaskSearchSortBar
				search={filters.search}
				sortBy={filters.sortBy}
				sortDirection={filters.sortDirection}
				onSearchChange={(search) => onFiltersChange({ search })}
				onSortChange={(sortBy) => onFiltersChange({ sortBy })}
				onSortDirectionChange={(sortDirection) =>
					onFiltersChange({ sortDirection })
				}
			/>
		</div>
	);
}
