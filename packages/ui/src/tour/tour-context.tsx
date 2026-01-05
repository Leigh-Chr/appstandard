/**
 * Tour Context - Global tour state management
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { TourStep } from "./types";

export interface TourContextValue {
	/** Whether the tour is currently active */
	isActive: boolean;
	/** Current step index */
	currentStep: number;
	/** All tour steps */
	steps: TourStep[];
	/** Start the tour */
	start: (steps: TourStep[]) => void;
	/** Go to next step */
	next: () => void;
	/** Go to previous step */
	prev: () => void;
	/** Skip/end the tour */
	end: () => void;
	/** Go to a specific step */
	goTo: (index: number) => void;
	/** Whether this is the first step */
	isFirstStep: boolean;
	/** Whether this is the last step */
	isLastStep: boolean;
	/** Current step data */
	currentStepData: TourStep | null;
	/** Mark tour as completed in storage */
	markCompleted: (tourId: string) => void;
	/** Check if tour was completed */
	isCompleted: (tourId: string) => boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

interface TourProviderProps {
	children: ReactNode;
	/** Storage key prefix for completed tours */
	storageKeyPrefix?: string | undefined;
}

const STORAGE_KEY = "appstandard_completed_tours";

export function TourProvider({
	children,
	storageKeyPrefix = "",
}: TourProviderProps) {
	const [isActive, setIsActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [steps, setSteps] = useState<TourStep[]>([]);

	const start = useCallback((newSteps: TourStep[]) => {
		if (newSteps.length === 0) return;
		setSteps(newSteps);
		setCurrentStep(0);
		setIsActive(true);
	}, []);

	const next = useCallback(() => {
		if (currentStep < steps.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [currentStep, steps.length]);

	const prev = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	const end = useCallback(() => {
		setIsActive(false);
		setCurrentStep(0);
		setSteps([]);
	}, []);

	const goTo = useCallback(
		(index: number) => {
			if (index >= 0 && index < steps.length) {
				setCurrentStep(index);
			}
		},
		[steps.length],
	);

	const markCompleted = useCallback(
		(tourId: string) => {
			try {
				const key = `${storageKeyPrefix}${STORAGE_KEY}`;
				const stored = localStorage.getItem(key);
				const completed: string[] = stored ? JSON.parse(stored) : [];
				if (!completed.includes(tourId)) {
					completed.push(tourId);
					localStorage.setItem(key, JSON.stringify(completed));
				}
			} catch {
				// Ignore storage errors
			}
		},
		[storageKeyPrefix],
	);

	const isCompleted = useCallback(
		(tourId: string) => {
			try {
				const key = `${storageKeyPrefix}${STORAGE_KEY}`;
				const stored = localStorage.getItem(key);
				const completed: string[] = stored ? JSON.parse(stored) : [];
				return completed.includes(tourId);
			} catch {
				return false;
			}
		},
		[storageKeyPrefix],
	);

	const value = useMemo<TourContextValue>(
		() => ({
			isActive,
			currentStep,
			steps,
			start,
			next,
			prev,
			end,
			goTo,
			isFirstStep: currentStep === 0,
			isLastStep: currentStep === steps.length - 1,
			currentStepData: steps[currentStep] ?? null,
			markCompleted,
			isCompleted,
		}),
		[
			isActive,
			currentStep,
			steps,
			start,
			next,
			prev,
			end,
			goTo,
			markCompleted,
			isCompleted,
		],
	);

	return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error("useTour must be used within a TourProvider");
	}
	return context;
}
