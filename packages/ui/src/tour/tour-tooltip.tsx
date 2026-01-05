/**
 * TourTooltip - Tooltip component for tour steps
 */

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../button";
import type { TourStep } from "./types";

export interface TourTooltipProps {
	step: TourStep;
	currentStep: number;
	totalSteps: number;
	onNext: () => void;
	onPrev: () => void;
	onEnd: () => void;
	isFirstStep: boolean;
	isLastStep: boolean;
	finishLabel?: string | undefined;
	nextLabel?: string | undefined;
	prevLabel?: string | undefined;
	skipLabel?: string | undefined;
}

interface Position {
	top: number;
	left: number;
	arrowPosition: "top" | "bottom" | "left" | "right";
}

function calculatePosition(
	targetRect: DOMRect,
	tooltipRect: DOMRect,
	placement: TourStep["placement"] = "bottom",
	padding = 12,
): Position {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	let top = 0;
	let left = 0;
	let arrowPosition: Position["arrowPosition"] = "top";

	switch (placement) {
		case "top":
			top = targetRect.top - tooltipRect.height - padding;
			left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
			arrowPosition = "bottom";
			break;
		case "bottom":
			top = targetRect.bottom + padding;
			left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
			arrowPosition = "top";
			break;
		case "left":
			top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
			left = targetRect.left - tooltipRect.width - padding;
			arrowPosition = "right";
			break;
		case "right":
			top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
			left = targetRect.right + padding;
			arrowPosition = "left";
			break;
	}

	// Ensure tooltip stays within viewport
	if (left < padding) left = padding;
	if (left + tooltipRect.width > viewportWidth - padding) {
		left = viewportWidth - tooltipRect.width - padding;
	}
	if (top < padding) {
		// Flip to bottom if not enough space on top
		if (placement === "top") {
			top = targetRect.bottom + padding;
			arrowPosition = "top";
		} else {
			top = padding;
		}
	}
	if (top + tooltipRect.height > viewportHeight - padding) {
		// Flip to top if not enough space on bottom
		if (placement === "bottom") {
			top = targetRect.top - tooltipRect.height - padding;
			arrowPosition = "bottom";
		} else {
			top = viewportHeight - tooltipRect.height - padding;
		}
	}

	return { top, left, arrowPosition };
}

export function TourTooltip({
	step,
	currentStep,
	totalSteps,
	onNext,
	onPrev,
	onEnd,
	isFirstStep,
	isLastStep,
	finishLabel = "Finish",
	nextLabel = "Next",
	prevLabel = "Back",
	skipLabel = "Skip",
}: TourTooltipProps) {
	const [position, setPosition] = useState<Position | null>(null);
	const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);

	const updatePosition = useCallback(() => {
		const target = document.querySelector(step.target);
		if (!target || !tooltipRef) return;

		const targetRect = target.getBoundingClientRect();
		const tooltipRect = tooltipRef.getBoundingClientRect();

		setPosition(calculatePosition(targetRect, tooltipRect, step.placement));

		// Scroll target into view if needed
		if (
			targetRect.top < 0 ||
			targetRect.bottom > window.innerHeight ||
			targetRect.left < 0 ||
			targetRect.right > window.innerWidth
		) {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [step.target, step.placement, tooltipRef]);

	useEffect(() => {
		updatePosition();

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [updatePosition]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onEnd();
			} else if (e.key === "ArrowRight" || e.key === "Enter") {
				if (isLastStep) onEnd();
				else onNext();
			} else if (e.key === "ArrowLeft") {
				if (!isFirstStep) onPrev();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onNext, onPrev, onEnd, isFirstStep, isLastStep]);

	const arrowClasses: Record<Position["arrowPosition"], string> = {
		top: "-top-2 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-card",
		bottom:
			"-bottom-2 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-card",
		left: "top-1/2 -left-2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-card",
		right:
			"top-1/2 -right-2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-card",
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={step.id}
				ref={setTooltipRef}
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.2 }}
				className="fixed z-[9999] w-80 rounded-lg border bg-card p-4 shadow-lg"
				style={
					position
						? {
								top: position.top,
								left: position.left,
							}
						: { visibility: "hidden" }
				}
			>
				{/* Arrow */}
				{position && (
					<div
						className={`absolute h-0 w-0 border-8 ${arrowClasses[position.arrowPosition]}`}
					/>
				)}

				{/* Close button */}
				<button
					type="button"
					onClick={onEnd}
					className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
				>
					<X className="h-3 w-3" />
				</button>

				{/* Content */}
				<div className="mb-4">
					<h3 className="mb-1 font-semibold text-base">{step.title}</h3>
					<p className="text-muted-foreground text-sm">{step.content}</p>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between">
					{/* Step indicator */}
					<div className="flex items-center gap-1">
						{Array.from({ length: totalSteps }).map((_, i) => (
							<div
								key={`indicator-${i}`}
								className={`h-1.5 w-1.5 rounded-full transition-colors ${
									i === currentStep
										? "bg-primary"
										: i < currentStep
											? "bg-primary/50"
											: "bg-muted"
								}`}
							/>
						))}
					</div>

					{/* Navigation buttons */}
					<div className="flex items-center gap-2">
						{!isFirstStep && (
							<Button variant="ghost" size="sm" onClick={onPrev}>
								<ChevronLeft className="mr-1 h-4 w-4" />
								{prevLabel}
							</Button>
						)}
						{isFirstStep && (
							<Button variant="ghost" size="sm" onClick={onEnd}>
								{skipLabel}
							</Button>
						)}
						<Button size="sm" onClick={isLastStep ? onEnd : onNext}>
							{isLastStep ? finishLabel : nextLabel}
							{!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
						</Button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
