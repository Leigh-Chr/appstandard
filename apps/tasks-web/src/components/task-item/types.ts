/**
 * Types for Task Item components
 */

export interface TaskCategory {
	id: string;
	category: string;
}

export interface Task {
	id: string;
	title: string;
	description?: string | null;
	status: string;
	priority?: number | null;
	percentComplete?: number | null;
	startDate?: string | Date | null;
	dueDate?: string | Date | null;
	location?: string | null;
	color?: string | null;
	class?: string | null;
	url?: string | null;
	rrule?: string | null;
	organizerName?: string | null;
	organizerEmail?: string | null;
	categories?: TaskCategory[];
	subtaskCount?: number;
	attendeeCount?: number;
	alarmCount?: number;
	createdAt: string | Date;
}

export interface TaskCardProps {
	task: Task;
	taskListId: string;
	taskListColor?: string | null;
	onToggle: (id: string, status: string) => void;
	onEdit: (id: string) => void;
	onDuplicate: (id: string) => void;
	onMove: (id: string) => void;
	onDelete: (id: string, title?: string) => void;
	isToggling: boolean;
	isDuplicating: boolean;
	/** Selection mode props */
	selectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

export interface KanbanCardProps {
	task: Task;
	taskListColor?: string | null;
	onToggle: (id: string, status: string) => void;
	onEdit: (id: string) => void;
	onDuplicate: (id: string) => void;
	onMove: (id: string) => void;
	onDelete: (id: string, title?: string) => void;
	isToggling: boolean;
	isDuplicating: boolean;
}

export interface KanbanColumnProps {
	title: string;
	icon: React.ReactNode;
	color: string;
	bgColor: string;
	tasks: Task[];
	taskListId: string;
	taskListColor?: string | null;
	onToggle: (id: string, status: string) => void;
	onEdit: (id: string) => void;
	onDuplicate: (id: string) => void;
	onMove: (id: string) => void;
	onDelete: (id: string, title?: string) => void;
	isToggling: boolean;
	isDuplicating: boolean;
}

/** Get priority badge info */
export function getPriorityInfo(priority: number | null | undefined) {
	if (priority === null || priority === undefined || priority === 0)
		return null;
	if (priority >= 1 && priority <= 4)
		return {
			label: "High",
			color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		};
	if (priority >= 5 && priority <= 6)
		return {
			label: "Medium",
			color:
				"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
		};
	return {
		label: "Low",
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	};
}

/** Format categories for display */
export function formatCategories(
	categories: TaskCategory[] | undefined,
): string {
	if (!categories || categories.length === 0) return "";
	return categories.map((c) => c.category).join(", ");
}
