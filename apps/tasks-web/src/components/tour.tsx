/**
 * Tour component - Guided onboarding for Tasks app
 * Uses the shared tour infrastructure from @appstandard/ui
 */

import { Tour, type TourStep, useTour } from "@appstandard/ui";
import { useLocation } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

const TOUR_ID = "tasks-onboarding";

/** Routes where the tour is available (has data-tour elements) */
const TOUR_AVAILABLE_ROUTES = ["/tasks"];

/** Tasks app tour steps */
function getTasksTourSteps(): TourStep[] {
	return [
		{
			id: "welcome",
			target: '[data-tour="header"]',
			title: "Welcome to AppStandard Tasks",
			content:
				"Manage your tasks with powerful todo list management. Let's take a quick tour!",
			placement: "bottom",
		},
		{
			id: "create-list",
			target: '[data-tour="new-task-list"]',
			title: "Create a Task List",
			content:
				"Click here to create a new task list. Organize your tasks by project, context, or priority.",
			placement: "bottom",
		},
		{
			id: "import-tasks",
			target: '[data-tour="import"]',
			title: "Import Tasks",
			content:
				"Import tasks from ICS/iCalendar files or other task management apps.",
			placement: "bottom",
		},
		{
			id: "search",
			target: '[data-tour="search"]',
			title: "Search & Sort",
			content:
				"Quickly find task lists by name and sort them by date, name, or task count.",
			placement: "bottom",
		},
		{
			id: "task-lists",
			target: '[data-tour="task-lists-section"]',
			title: "Your Task Lists",
			content:
				"All your task lists are organized here. Click any list to view and manage its tasks.",
			placement: "top",
		},
		{
			id: "groups",
			target: '[data-tour="groups-section"]',
			title: "Organize with Groups",
			content:
				"Create groups to organize related task lists together. Perfect for separating work and personal tasks.",
			placement: "top",
		},
	];
}

/**
 * Hook to control the tasks tour
 * Only allows starting the tour on pages that have tour elements
 */
export function useTasksTour() {
	const { start, end, isActive, markCompleted, isCompleted } = useTour();
	const location = useLocation();
	const steps = useMemo(() => getTasksTourSteps(), []);

	// Check if tour is available on current route
	const isAvailable = TOUR_AVAILABLE_ROUTES.includes(location.pathname);

	const startTour = useCallback(() => {
		if (isAvailable) {
			start(steps);
		}
	}, [start, steps, isAvailable]);

	return {
		startTour: isAvailable ? startTour : undefined,
		endTour: end,
		isActive,
		isAvailable,
		isCompleted: isCompleted(TOUR_ID),
		markCompleted: () => markCompleted(TOUR_ID),
	};
}

/**
 * Tour overlay component - renders the actual tour UI
 * Must be placed inside TourProvider
 */
export function TasksTour() {
	const { markCompleted, end } = useTour();

	return (
		<Tour
			tourId={TOUR_ID}
			onComplete={() => markCompleted(TOUR_ID)}
			onSkip={end}
		/>
	);
}
