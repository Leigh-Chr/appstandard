/**
 * Tour component - Guided onboarding for Calendar app
 * Uses the shared tour infrastructure from @appstandard/ui
 */

import { Tour, type TourStep, useTour } from "@appstandard/ui";
import { useLocation } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

const TOUR_ID = "calendar-onboarding";

/** Routes where the tour is available (has data-tour elements) */
const TOUR_AVAILABLE_ROUTES = ["/calendars"];

/** Calendar app tour steps */
function getCalendarTourSteps(): TourStep[] {
	return [
		{
			id: "welcome",
			target: '[data-tour="header"]',
			title: "Welcome to AppStandard Calendar",
			content:
				"Manage your calendars with a powerful ICS-compatible interface. Let's take a quick tour!",
			placement: "bottom",
		},
		{
			id: "create-calendar",
			target: '[data-tour="new-calendar"]',
			title: "Create a Calendar",
			content:
				"Click here to create a new calendar. You can import existing ICS files or start fresh.",
			placement: "bottom",
		},
		{
			id: "import-calendars",
			target: '[data-tour="import"]',
			title: "Import Calendars",
			content:
				"Import ICS files from other calendar apps like Google Calendar, Apple Calendar, or Outlook.",
			placement: "bottom",
		},
		{
			id: "search",
			target: '[data-tour="search"]',
			title: "Search & Sort",
			content:
				"Quickly find calendars by name and sort them by date, name, or event count.",
			placement: "bottom",
		},
		{
			id: "calendars-list",
			target: '[data-tour="calendars-section"]',
			title: "Your Calendars",
			content:
				"All your calendars are organized here. Click any calendar to view and manage its events.",
			placement: "top",
		},
		{
			id: "groups",
			target: '[data-tour="groups-section"]',
			title: "Organize with Groups",
			content:
				"Create groups to organize related calendars together. Perfect for separating work and personal calendars.",
			placement: "top",
		},
	];
}

/**
 * Hook to control the calendar tour
 * Only allows starting the tour on pages that have tour elements
 */
export function useCalendarTour() {
	const { start, end, isActive, markCompleted, isCompleted } = useTour();
	const location = useLocation();
	const steps = useMemo(() => getCalendarTourSteps(), []);

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
export function CalendarTour() {
	const { markCompleted, end } = useTour();

	return (
		<Tour
			tourId={TOUR_ID}
			onComplete={() => markCompleted(TOUR_ID)}
			onSkip={end}
		/>
	);
}
