/**
 * Task presets for quick creation
 */

import type { TaskFormData } from "../types/task";

export interface TaskPreset {
	id: string;
	label: string;
	icon: string;
	description: string;
	defaults: Partial<TaskFormData>;
}

const TASK_PRESETS: TaskPreset[] = [
	{
		id: "quick",
		label: "Quick Task",
		icon: "⚡",
		description: "Simple task with no due date",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
			priority: 5,
		},
	},
	{
		id: "today",
		label: "Due Today",
		icon: "📅",
		description: "Task due by end of today",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
			priority: 5,
			alarms: [
				{
					trigger: "-PT1H",
					action: "DISPLAY",
					summary: "Task reminder",
				},
			],
		},
	},
	{
		id: "urgent",
		label: "Urgent",
		icon: "🔴",
		description: "High priority urgent task",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
			priority: 1,
			alarms: [
				{
					trigger: "-PT30M",
					action: "DISPLAY",
					summary: "Urgent task reminder",
				},
			],
		},
	},
	{
		id: "recurring",
		label: "Recurring",
		icon: "🔄",
		description: "Task that repeats regularly",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
			priority: 5,
			rrule: "FREQ=WEEKLY;COUNT=10",
		},
	},
	{
		id: "project",
		label: "Project Task",
		icon: "📁",
		description: "Task with subtasks",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
			priority: 5,
			percentComplete: 0,
		},
	},
	{
		id: "custom",
		label: "Custom",
		icon: "⚙️",
		description: "Start from scratch",
		defaults: {
			status: "NEEDS_ACTION",
			class: "PRIVATE",
		},
	},
];

/**
 * Get a preset by ID
 */
function getPreset(id: string): TaskPreset | undefined {
	return TASK_PRESETS.find((p) => p.id === id);
}

/**
 * Get preset label with icon
 */
export function getPresetLabel(presetId: string): string {
	const preset = getPreset(presetId);
	return preset ? `${preset.icon} ${preset.label}` : presetId;
}

/**
 * Get all preset IDs
 */
export function getAllPresetIds(): string[] {
	return TASK_PRESETS.map((p) => p.id);
}

/**
 * Apply preset defaults to form data
 */
export function applyPreset(
	presetId: string,
	baseData: Partial<TaskFormData>,
): TaskFormData {
	const preset = getPreset(presetId);
	if (!preset) {
		return baseData as TaskFormData;
	}

	return {
		title: "",
		...preset.defaults,
		...baseData,
	};
}
