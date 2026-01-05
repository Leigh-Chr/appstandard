/**
 * Tour - Main tour component with spotlight effect
 */

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./tour-context";
import { TourTooltip } from "./tour-tooltip";

export interface TourProps {
	/** Tour identifier for persistence */
	tourId: string;
	/** Whether to show the tour automatically on first visit */
	autoStart?: boolean | undefined;
	/** Callback when tour completes */
	onComplete?: (() => void) | undefined;
	/** Callback when tour is skipped */
	onSkip?: (() => void) | undefined;
	/** Labels for localization */
	labels?: {
		finish?: string | undefined;
		next?: string | undefined;
		prev?: string | undefined;
		skip?: string | undefined;
	};
}

interface SpotlightRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export function Tour({
	tourId,
	autoStart = false,
	onComplete,
	onSkip,
	labels,
}: TourProps) {
	const {
		isActive,
		currentStep,
		steps,
		next,
		prev,
		end,
		isFirstStep,
		isLastStep,
		currentStepData,
		markCompleted,
		isCompleted,
		start,
	} = useTour();

	const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(
		null,
	);
	const [mounted, setMounted] = useState(false);

	// Mount check for portal
	useEffect(() => {
		setMounted(true);
	}, []);

	// Auto-start if configured
	useEffect(() => {
		if (autoStart && !isActive && !isCompleted(tourId) && steps.length > 0) {
			start(steps);
		}
	}, [autoStart, isActive, isCompleted, tourId, steps, start]);

	// Update spotlight position when step changes
	useEffect(() => {
		if (!isActive || !currentStepData) {
			setSpotlightRect(null);
			return;
		}

		const updateSpotlight = () => {
			const target = document.querySelector(currentStepData.target);
			if (!target) {
				setSpotlightRect(null);
				return;
			}

			const rect = target.getBoundingClientRect();
			const padding = 8;
			setSpotlightRect({
				top: rect.top - padding,
				left: rect.left - padding,
				width: rect.width + padding * 2,
				height: rect.height + padding * 2,
			});

			// Execute step action if defined
			if (currentStepData.action) {
				currentStepData.action();
			}
		};

		// Initial update with slight delay to ensure DOM is ready
		const timeoutId = setTimeout(updateSpotlight, 100);

		window.addEventListener("resize", updateSpotlight);
		window.addEventListener("scroll", updateSpotlight, true);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", updateSpotlight);
			window.removeEventListener("scroll", updateSpotlight, true);
		};
	}, [isActive, currentStepData]);

	const handleEnd = useCallback(() => {
		if (isLastStep) {
			markCompleted(tourId);
			onComplete?.();
		} else {
			onSkip?.();
		}
		end();
	}, [isLastStep, markCompleted, tourId, onComplete, onSkip, end]);

	const handleNext = useCallback(() => {
		if (isLastStep) {
			markCompleted(tourId);
			onComplete?.();
			end();
		} else {
			next();
		}
	}, [isLastStep, markCompleted, tourId, onComplete, end, next]);

	if (!mounted || !isActive || !currentStepData) {
		return null;
	}

	return createPortal(
		<AnimatePresence>
			{isActive && (
				<>
					{/* Backdrop with spotlight cutout */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[9998]"
						style={{
							background: spotlightRect
								? `radial-gradient(ellipse ${spotlightRect.width + 40}px ${spotlightRect.height + 40}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 0%, rgba(0, 0, 0, 0.5) 100%)`
								: "rgba(0, 0, 0, 0.5)",
						}}
						onClick={(e) => {
							// Only close if clicking on backdrop, not on spotlight area
							if (spotlightRect) {
								const clickX = e.clientX;
								const clickY = e.clientY;
								const inSpotlight =
									clickX >= spotlightRect.left &&
									clickX <= spotlightRect.left + spotlightRect.width &&
									clickY >= spotlightRect.top &&
									clickY <= spotlightRect.top + spotlightRect.height;
								if (!inSpotlight) {
									// Don't close on backdrop click, just ignore
								}
							}
						}}
					/>

					{/* Spotlight highlight border */}
					{spotlightRect && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="pointer-events-none fixed z-[9998] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
							style={{
								top: spotlightRect.top,
								left: spotlightRect.left,
								width: spotlightRect.width,
								height: spotlightRect.height,
							}}
						/>
					)}

					{/* Tooltip */}
					<TourTooltip
						step={currentStepData}
						currentStep={currentStep}
						totalSteps={steps.length}
						onNext={handleNext}
						onPrev={prev}
						onEnd={handleEnd}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						finishLabel={labels?.finish}
						nextLabel={labels?.next}
						prevLabel={labels?.prev}
						skipLabel={labels?.skip}
					/>
				</>
			)}
		</AnimatePresence>,
		document.body,
	);
}
