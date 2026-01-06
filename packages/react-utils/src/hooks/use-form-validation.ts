import { useCallback, useState } from "react";

export type ValidationErrors = Record<string, string | undefined>;

export interface UseFormValidationOptions<T> {
	/** Validation function that returns errors object */
	validate: (data: T) => ValidationErrors;
	/** Callback when scrolling to first error */
	onScrollToError?: (fieldId: string) => void;
}

export interface UseFormValidationReturn {
	/** Current validation errors */
	errors: ValidationErrors;
	/** Set validation errors manually */
	setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
	/** Validate a single field and update errors */
	validateField: (field: string, error: string | undefined) => void;
	/** Validate entire form, returns true if valid */
	validateForm: <T>(
		data: T,
		validate: (data: T) => ValidationErrors,
	) => boolean;
	/** Check if there are any validation errors */
	hasErrors: () => boolean;
	/** Clear all validation errors */
	clearErrors: () => void;
	/** Get the first error message */
	getFirstError: () => string | null;
	/** Get the ID of the first field with an error */
	getFirstErrorFieldId: () => string | null;
	/** Scroll to the first field with an error */
	scrollToFirstError: (expandSection?: (section: string) => void) => void;
}

/** Map field IDs to their containing sections */
export type FieldSectionMap = Record<string, string>;

/**
 * Hook for form validation with error tracking and auto-scroll
 *
 * Features:
 * - Real-time field validation
 * - Form-wide validation on submit
 * - Auto-scroll to first error field
 * - Section expansion on error
 *
 * @example
 * ```tsx
 * const {
 *   errors,
 *   validateField,
 *   validateForm,
 *   scrollToFirstError,
 * } = useFormValidation();
 *
 * const handleTitleChange = (value: string) => {
 *   setTitle(value);
 *   validateField("title", value.trim() ? undefined : "Title is required");
 * };
 *
 * const handleSubmit = () => {
 *   if (!validateForm(formData, validateTaskForm)) {
 *     scrollToFirstError((section) => setExpandedSections(s => new Set([...s, section])));
 *     return;
 *   }
 *   onSubmit(formData);
 * };
 * ```
 */
export function useFormValidation(
	initialErrors: ValidationErrors = {},
): UseFormValidationReturn {
	const [errors, setErrors] = useState<ValidationErrors>(initialErrors);

	const validateField = useCallback(
		(field: string, error: string | undefined) => {
			setErrors((prev) => ({
				...prev,
				[field]: error,
			}));
		},
		[],
	);

	const validateForm = useCallback(
		<T>(data: T, validate: (data: T) => ValidationErrors): boolean => {
			const newErrors = validate(data);
			setErrors(newErrors);
			return !Object.values(newErrors).some((error) => error !== undefined);
		},
		[],
	);

	const hasErrors = useCallback(() => {
		return Object.values(errors).some((error) => error !== undefined);
	}, [errors]);

	const clearErrors = useCallback(() => {
		setErrors({});
	}, []);

	const getFirstError = useCallback((): string | null => {
		for (const error of Object.values(errors)) {
			if (error) return error;
		}
		return null;
	}, [errors]);

	const getFirstErrorFieldId = useCallback((): string | null => {
		for (const [field, error] of Object.entries(errors)) {
			if (error) return field;
		}
		return null;
	}, [errors]);

	const scrollToFirstError = useCallback(
		(expandSection?: (section: string) => void) => {
			const fieldId = getFirstErrorFieldId();
			if (!fieldId) return;

			// Small delay to ensure DOM is updated
			setTimeout(() => {
				const element = document.getElementById(fieldId);
				if (!element) return;

				// If we have a section expander and can determine the section, expand it
				if (expandSection) {
					// Common field-to-section mappings
					const sectionMappings: FieldSectionMap = {
						title: "basic",
						startDate: "basic",
						endDate: "basic",
						dueDate: "dates",
						description: "basic",
						location: "details",
						url: "details",
					};

					const section = sectionMappings[fieldId];
					if (section) {
						expandSection(section);
					}
				}

				// Scroll to the element after potential section expansion
				setTimeout(() => {
					element.scrollIntoView({
						behavior: "smooth",
						block: "center",
						inline: "nearest",
					});

					// Focus on the element for better accessibility
					if (
						element instanceof HTMLInputElement ||
						element instanceof HTMLTextAreaElement ||
						element instanceof HTMLSelectElement
					) {
						element.focus();
					}
				}, 100);
			}, 100);
		},
		[getFirstErrorFieldId],
	);

	return {
		errors,
		setErrors,
		validateField,
		validateForm,
		hasErrors,
		clearErrors,
		getFirstError,
		getFirstErrorFieldId,
		scrollToFirstError,
	};
}
