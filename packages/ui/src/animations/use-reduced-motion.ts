/**
 * Hook to detect prefers-reduced-motion media query
 * UX-001: Respect user's motion preferences for accessibility
 */

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns true if the user prefers reduced motion
 * Falls back to false during SSR
 */
export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		// SSR fallback
		if (typeof window === "undefined") return false;
		return window.matchMedia(REDUCED_MOTION_QUERY).matches;
	});

	useEffect(() => {
		const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches);
		};

		// Modern browsers
		mediaQuery.addEventListener("change", handleChange);

		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, []);

	return prefersReducedMotion;
}

/**
 * Get animation variants that respect reduced motion
 * Returns instant transitions when reduced motion is preferred
 */
export function getMotionTransition(
	prefersReducedMotion: boolean,
	duration = 0.3,
) {
	if (prefersReducedMotion) {
		return { duration: 0 };
	}
	return {
		duration,
		ease: [0.25, 0.1, 0.25, 1],
	};
}
