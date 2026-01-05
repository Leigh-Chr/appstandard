/**
 * Type definitions for validation errors
 * Shared between frontend and backend
 */

export interface ValidationErrors {
	title?: string;
	description?: string;
	dueDate?: string;
	startDate?: string;
	completedDate?: string;
	priority?: string;
	status?: string;
	percentComplete?: string;
	url?: string;
	location?: string;
	uid?: string;
	subtasks?: Record<
		number,
		{
			title?: string;
			completed?: string;
		}
	>;
	reminders?: Record<
		number,
		{
			trigger?: string;
			action?: string;
		}
	>;
}
