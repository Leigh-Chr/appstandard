/**
 * Tour component - Guided onboarding for Contacts app
 * Uses the shared tour infrastructure from @appstandard/ui
 */

import { Tour, type TourStep, useTour } from "@appstandard/ui";
import { useLocation } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

const TOUR_ID = "contacts-onboarding";

/** Routes where the tour is available (has data-tour elements) */
const TOUR_AVAILABLE_ROUTES = ["/contacts"];

/** Contacts app tour steps */
function getContactsTourSteps(): TourStep[] {
	return [
		{
			id: "welcome",
			target: '[data-tour="header"]',
			title: "Welcome to AppStandard Contacts",
			content:
				"Manage your address books with vCard-compatible contact management. Let's take a quick tour!",
			placement: "bottom",
		},
		{
			id: "create-address-book",
			target: '[data-tour="new-address-book"]',
			title: "Create an Address Book",
			content:
				"Click here to create a new address book. You can import existing vCard files or start fresh.",
			placement: "bottom",
		},
		{
			id: "import-contacts",
			target: '[data-tour="import"]',
			title: "Import Contacts",
			content:
				"Import vCard files from other contact apps like Apple Contacts, Google Contacts, or Outlook.",
			placement: "bottom",
		},
		{
			id: "search",
			target: '[data-tour="search"]',
			title: "Search & Sort",
			content:
				"Quickly find address books by name and sort them by date, name, or contact count.",
			placement: "bottom",
		},
		{
			id: "address-books-list",
			target: '[data-tour="address-books-section"]',
			title: "Your Address Books",
			content:
				"All your address books are organized here. Click any address book to view and manage its contacts.",
			placement: "top",
		},
		{
			id: "groups",
			target: '[data-tour="groups-section"]',
			title: "Organize with Groups",
			content:
				"Create groups to organize related address books together. Perfect for separating work and personal contacts.",
			placement: "top",
		},
	];
}

/**
 * Hook to control the contacts tour
 * Only allows starting the tour on pages that have tour elements
 */
export function useContactsTour() {
	const { start, end, isActive, markCompleted, isCompleted } = useTour();
	const location = useLocation();
	const steps = useMemo(() => getContactsTourSteps(), []);

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
export function ContactsTour() {
	const { markCompleted, end } = useTour();

	return (
		<Tour
			tourId={TOUR_ID}
			onComplete={() => markCompleted(TOUR_ID)}
			onSkip={end}
		/>
	);
}
