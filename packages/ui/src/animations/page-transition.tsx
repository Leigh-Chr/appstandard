/**
 * Page Transition - Smooth animations between pages
 * UX-001: Respects prefers-reduced-motion for accessibility
 */

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

interface PageTransitionProps {
	children: ReactNode;
	className?: string;
}

/**
 * Fade and slide up transition
 * Respects prefers-reduced-motion: shows instant opacity transition
 */
export function PageTransition({ children, className }: PageTransitionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
			transition={{
				duration: prefersReducedMotion ? 0.1 : 0.3,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Staggered fade in for lists
 * Respects prefers-reduced-motion
 */
export function StaggerContainer({
	children,
	className,
	delay = 0,
}: PageTransitionProps & { delay?: number }) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: {
					transition: {
						staggerChildren: prefersReducedMotion ? 0 : 0.05,
						delayChildren: prefersReducedMotion ? 0 : delay,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Individual stagger item
 * Respects prefers-reduced-motion
 */
export function StaggerItem({ children, className }: PageTransitionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: prefersReducedMotion ? 0.1 : 0.3,
						ease: [0.25, 0.1, 0.25, 1],
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Scale fade transition (good for modals/cards)
 * Respects prefers-reduced-motion
 */
export function ScaleFade({ children, className }: PageTransitionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
			transition={{
				duration: prefersReducedMotion ? 0.1 : 0.2,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Slide from right (good for detail pages)
 * Respects prefers-reduced-motion
 */
export function SlideFromRight({ children, className }: PageTransitionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
			transition={{
				duration: prefersReducedMotion ? 0.1 : 0.3,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Animated list item with exit animation
 * Respects prefers-reduced-motion
 */
export function AnimatedListItem({
	children,
	className,
	layoutId,
}: PageTransitionProps & { layoutId?: string | undefined }) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			layout={!prefersReducedMotion}
			{...(layoutId !== undefined && !prefersReducedMotion ? { layoutId } : {})}
			initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{
				opacity: 0,
				scale: prefersReducedMotion ? 1 : 0.9,
				transition: { duration: prefersReducedMotion ? 0.05 : 0.15 },
			}}
			transition={{
				duration: prefersReducedMotion ? 0.1 : 0.2,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			{...(className !== undefined ? { className } : {})}
		>
			{children}
		</motion.div>
	);
}

/**
 * Presence wrapper for conditional rendering with animation
 */
export function Presence({
	children,
	show,
	mode = "sync",
}: {
	children: ReactNode;
	show: boolean;
	mode?: "sync" | "wait" | "popLayout";
}) {
	return <AnimatePresence mode={mode}>{show && children}</AnimatePresence>;
}
