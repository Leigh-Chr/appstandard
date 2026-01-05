/**
 * Empty State - Engaging empty states with illustrations
 */

import { cn } from "@appstandard/react-utils";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "./button";

type ButtonVariant =
	| "default"
	| "destructive"
	| "outline"
	| "secondary"
	| "ghost"
	| "link";

export interface EmptyStateAction {
	label: string;
	onClick: () => void;
	variant?: ButtonVariant | undefined;
	icon?: ReactNode | undefined;
}

export interface EmptyStateProps {
	icon?: ReactNode | undefined;
	title: string;
	description?: string | undefined;
	action?: EmptyStateAction | undefined;
	secondaryAction?: Omit<EmptyStateAction, "variant"> | undefined;
	className?: string | undefined;
	children?: ReactNode | undefined;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	secondaryAction,
	className,
	children,
}: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className={cn(
				"relative flex flex-col items-center justify-center py-8 text-center sm:py-16",
				className,
			)}
		>
			{/* Subtle background glow */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div className="h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
			</div>

			{icon && (
				<motion.div
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
					className="relative mb-6"
				>
					{/* Decorative ring */}
					<div className="absolute inset-0 scale-150 rounded-full border border-primary/10" />
					{icon}
				</motion.div>
			)}

			<motion.h3
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="relative mb-2 text-heading-3"
			>
				{title}
			</motion.h3>

			{description && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="relative mb-4 max-w-md text-muted-foreground sm:mb-6"
				>
					{description}
				</motion.p>
			)}

			{(action || secondaryAction) && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="relative flex flex-col justify-center gap-3 sm:flex-row"
				>
					{action && (
						<Button
							onClick={action.onClick}
							variant={action.variant || "default"}
							className="interactive-glow"
						>
							{action.icon}
							{action.label}
						</Button>
					)}
					{secondaryAction && (
						<Button onClick={secondaryAction.onClick} variant="outline">
							{secondaryAction.icon}
							{secondaryAction.label}
						</Button>
					)}
				</motion.div>
			)}

			{children}
		</motion.div>
	);
}

/**
 * Illustration: Search Empty
 */
export function EmptySearchIllustration({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-32 w-32 text-muted-foreground/30", className)}
			viewBox="0 0 128 128"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="No results"
		>
			<circle cx="52" cy="52" r="32" stroke="currentColor" strokeWidth="4" />
			<path
				d="M76 76L104 104"
				stroke="currentColor"
				strokeWidth="6"
				strokeLinecap="round"
			/>
			{/* Question mark */}
			<path
				d="M44 44C44 40 48 36 52 36C56 36 60 40 60 44C60 48 56 50 52 52V58"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<circle cx="52" cy="66" r="3" fill="currentColor" />
		</svg>
	);
}

/**
 * Illustration: Import File
 */
export function ImportFileIllustration({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-32 w-32 text-muted-foreground/30", className)}
			viewBox="0 0 128 128"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Import a file"
		>
			{/* File shape */}
			<path
				d="M32 16H80L96 32V112H32V16Z"
				stroke="currentColor"
				strokeWidth="4"
			/>
			<path d="M80 16V32H96" stroke="currentColor" strokeWidth="4" />
			{/* Arrow */}
			<path
				d="M64 56V88"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<path
				d="M52 76L64 88L76 76"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Lines on document */}
			<path d="M44 48H72" stroke="currentColor" strokeWidth="2" opacity="0.5" />
		</svg>
	);
}

/**
 * Illustration: Success/Checkmark
 */
export function SuccessIllustration({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-32 w-32 text-green-500", className)}
			viewBox="0 0 128 128"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Success"
		>
			<circle cx="64" cy="64" r="48" stroke="currentColor" strokeWidth="4" />
			<motion.path
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				d="M40 64L56 80L88 48"
				stroke="currentColor"
				strokeWidth="6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Generic empty list illustration
 */
export function EmptyListIllustration({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-32 w-32 text-muted-foreground/30", className)}
			viewBox="0 0 128 128"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Empty list"
		>
			{/* Document/list shape */}
			<rect
				x="24"
				y="16"
				width="80"
				height="96"
				rx="4"
				stroke="currentColor"
				strokeWidth="4"
			/>
			{/* Lines representing list items */}
			<rect
				x="36"
				y="36"
				width="56"
				height="8"
				rx="2"
				fill="currentColor"
				opacity="0.3"
			/>
			<rect
				x="36"
				y="52"
				width="48"
				height="8"
				rx="2"
				fill="currentColor"
				opacity="0.2"
			/>
			<rect
				x="36"
				y="68"
				width="52"
				height="8"
				rx="2"
				fill="currentColor"
				opacity="0.15"
			/>
			<rect
				x="36"
				y="84"
				width="40"
				height="8"
				rx="2"
				fill="currentColor"
				opacity="0.1"
			/>
		</svg>
	);
}
