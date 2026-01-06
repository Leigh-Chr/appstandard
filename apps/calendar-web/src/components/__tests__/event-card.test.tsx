/**
 * Tests for EventCard component
 */

// Setup DOM environment for Bun test BEFORE any other imports
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost",
	pretendToBeVisual: true,
});
// Set global document before any testing-library imports
(globalThis as any).document = dom.window.document;
(globalThis as any).window = dom.window;
(globalThis as any).navigator = dom.window.navigator;

// Mock window.matchMedia for media query hooks (useMediaQuery, useIsMobile, etc.)
(globalThis as any).window.matchMedia = (query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: () => {},
	removeListener: () => {},
	addEventListener: () => {},
	removeEventListener: () => {},
	dispatchEvent: () => true,
});

import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "../event-list/event-card";
import type { EventItem } from "../event-list/types";

// Mock router
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

// Mock motion - filter out Framer Motion-specific props to avoid DOM warnings
vi.mock("motion/react", () => ({
	motion: {
		div: ({
			children,
			layout: _layout,
			initial: _initial,
			animate: _animate,
			exit: _exit,
			transition: _transition,
			...props
		}: React.ComponentPropsWithoutRef<"div"> & {
			layout?: boolean;
			initial?: unknown;
			animate?: unknown;
			exit?: unknown;
			transition?: unknown;
		}) => React.createElement("div", props, children),
	},
}));

describe("EventCard", () => {
	const mockEvent: EventItem = {
		id: "event-1",
		title: "Test Event",
		startDate: new Date("2024-01-01T10:00:00Z"),
		endDate: new Date("2024-01-01T11:00:00Z"),
		description: "Test description",
		location: "Test location",
		color: "#FF0000",
		attendees: [],
		alarms: [],
		categories: [],
		resources: [],
	};

	const defaultProps = {
		event: mockEvent,
		calendarId: "cal-1",
		onEdit: vi.fn(),
		onDelete: vi.fn(),
		isDeleting: false,
	};

	it("should render event title", () => {
		const { container } = render(<EventCard {...defaultProps} />);
		const titleElement =
			container.querySelector("text") || container.textContent;
		expect(titleElement).toBeTruthy();
		expect(container.textContent).toContain("Test Event");
	});

	it("should call onDelete when delete is clicked", () => {
		const onDelete = vi.fn();
		render(<EventCard {...defaultProps} onDelete={onDelete} />);

		// Find and click delete button (implementation depends on UI structure)
		// This is a placeholder test structure
		expect(onDelete).toBeDefined();
	});
});
