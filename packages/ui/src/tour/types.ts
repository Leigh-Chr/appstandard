/**
 * Tour step types
 */

export interface TourStep {
	/** Unique identifier for this step */
	id: string;
	/** CSS selector or element ref for the target element */
	target: string;
	/** Title of the step */
	title: string;
	/** Description/content of the step */
	content: string;
	/** Placement of the tooltip relative to target */
	placement?: "top" | "bottom" | "left" | "right" | undefined;
	/** Whether to disable interaction with the target during this step */
	disableInteraction?: boolean | undefined;
	/** Custom action for this step */
	action?: (() => void) | undefined;
}
