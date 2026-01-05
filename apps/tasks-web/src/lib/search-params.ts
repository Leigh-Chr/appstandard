/**
 * Search params schemas for URL state management
 * Uses Zod for validation with fallback defaults
 *
 * Benefits of URL search params:
 * - Shareable URLs (users can share filtered views)
 * - Browser back/forward navigation works correctly
 * - State persists on page refresh
 * - SEO friendly (for public pages)
 *
 * Using @tanstack/zod-adapter's fallback() for graceful error handling:
 * - Invalid URL params fall back to defaults instead of throwing
 * - Users can't break the app by manually editing URLs
 */

import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

// ============================================================================
// Login Page Search Params
// Used in /login
// ============================================================================

const loginModes = ["signin", "signup"] as const;

export const loginSearchSchema = z.object({
	/** Display mode: sign in or sign up form */
	mode: fallback(z.enum(loginModes), "signup").default("signup"),
	/** Redirect URL after successful authentication */
	redirect: z.string().optional().catch(undefined),
});

type LoginSearch = z.infer<typeof loginSearchSchema>;

export const loginDefaults: LoginSearch = {
	mode: "signup",
	redirect: undefined,
};

// ============================================================================
// Task Lists List Search Params
// Used in /tasks
// ============================================================================

const taskListsListSortOptions = [
	"name",
	"updatedAt",
	"createdAt",
	"taskCount",
] as const;

const taskListsListSortDirections = ["asc", "desc"] as const;

export const taskListsListSearchSchema = z.object({
	/** Search keyword for task list names */
	q: fallback(z.string(), "").default(""),
	/** Sort by field */
	sortBy: fallback(z.enum(taskListsListSortOptions), "updatedAt").default(
		"updatedAt",
	),
	/** Sort direction */
	sortDirection: fallback(z.enum(taskListsListSortDirections), "desc").default(
		"desc",
	),
});

type TaskListsListSearch = z.infer<typeof taskListsListSearchSchema>;

export const taskListsListDefaults: TaskListsListSearch = {
	q: "",
	sortBy: "updatedAt",
	sortDirection: "desc",
};

// ============================================================================
// Task List Detail View Search Params
// Used in /tasks/$taskListId
// ============================================================================

/** View modes for task list detail */
const taskListViewModes = ["list", "kanban"] as const;

/** Status filter options */
const taskStatusFilters = [
	"all",
	"needs-action",
	"in-progress",
	"completed",
	"cancelled",
] as const;
export type TaskStatusFilter = (typeof taskStatusFilters)[number];

/** Priority filter options */
const taskPriorityFilters = ["all", "high", "medium", "low"] as const;
export type TaskPriorityFilter = (typeof taskPriorityFilters)[number];

/** Sort options for tasks */
const taskSortOptions = ["dueDate", "created", "priority", "title"] as const;
export type TaskSortBy = (typeof taskSortOptions)[number];

/** Sort direction */
const sortDirections = ["asc", "desc"] as const;
export type SortDirection = (typeof sortDirections)[number];

export const taskListViewSearchSchema = z.object({
	/** View mode: list or kanban */
	view: fallback(z.enum(taskListViewModes), "list").default("list"),
	/** Search keyword */
	q: fallback(z.string(), "").default(""),
	/** Status filter */
	status: fallback(z.enum(taskStatusFilters), "all").default("all"),
	/** Priority filter */
	priority: fallback(z.enum(taskPriorityFilters), "all").default("all"),
	/** Sort by field */
	sortBy: fallback(z.enum(taskSortOptions), "dueDate").default("dueDate"),
	/** Sort direction */
	sortDirection: fallback(z.enum(sortDirections), "asc").default("asc"),
});

type TaskListViewSearch = z.infer<typeof taskListViewSearchSchema>;

export const taskListViewDefaults: TaskListViewSearch = {
	view: "list",
	q: "",
	status: "all",
	priority: "all",
	sortBy: "dueDate",
	sortDirection: "asc",
};
