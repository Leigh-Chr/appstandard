/**
 * Task lists section component
 * Displays the task lists grid or empty state
 */

import {
	Button,
	Card,
	CardContent,
	StaggerContainer,
	StaggerItem,
} from "@appstandard/ui";
import { Link, type useNavigate } from "@tanstack/react-router";
import { FileUp, ListTodo, Plus } from "lucide-react";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { TaskListCard } from "./task-list-card";

interface TaskListsSectionProps {
	taskLists: Array<{
		id: string;
		name: string;
		taskCount: number;
		completedCount?: number;
		color?: string | null;
		sourceUrl?: string | null;
		lastSyncedAt?: string | Date | null;
	}>;
	navigate: ReturnType<typeof useNavigate>;
	dialogHandlers: {
		openEditDialog: (id: string, name: string, color?: string | null) => void;
		openDeleteDialog: (id: string, name: string) => void;
	};
	selectionHandlers: {
		selectionMode: boolean;
		selectedIds: Set<string>;
		handleToggleSelect: (id: string) => void;
	};
	isDeleting: boolean;
	isUpdating: boolean;
}

export function TaskListsSection({
	taskLists,
	navigate,
	dialogHandlers,
	selectionHandlers,
	isDeleting,
	isUpdating,
}: TaskListsSectionProps) {
	return (
		<div data-tour={TOUR_STEP_IDS.TASK_LISTS_SECTION}>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-heading-2">Task Lists</h2>
			</div>

			{taskLists.length === 0 ? (
				<Card id={TOUR_STEP_IDS.TASK_LIST_GRID}>
					<CardContent className="py-8 text-center sm:py-16">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:mb-6 sm:h-16 sm:w-16">
							<ListTodo className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
						</div>
						<h3 className="mb-2 text-heading-3">No task lists yet</h3>
						<p className="mb-4 text-muted-foreground sm:mb-6">
							Create your first task list or import an existing .ics file.
						</p>
						<div className="flex flex-col justify-center gap-3 sm:flex-row">
							<Button onClick={() => navigate({ to: "/tasks/new" })}>
								<Plus className="mr-2 h-4 w-4" />
								Create a task list
							</Button>
							<Button variant="outline" asChild>
								<Link to="/tasks/import">
									<FileUp className="mr-2 h-4 w-4" />
									Import a .ics
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div id={TOUR_STEP_IDS.TASK_LIST_GRID}>
					<StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{taskLists.map((taskList) => (
							<StaggerItem key={taskList.id}>
								<TaskListCard
									taskList={taskList}
									onOpen={() => navigate({ to: `/tasks/${taskList.id}` })}
									onEdit={() =>
										dialogHandlers.openEditDialog(
											taskList.id,
											taskList.name,
											taskList.color,
										)
									}
									onDelete={() =>
										dialogHandlers.openDeleteDialog(taskList.id, taskList.name)
									}
									isDeleting={isDeleting}
									isUpdating={isUpdating}
									selectionMode={selectionHandlers.selectionMode}
									isSelected={selectionHandlers.selectedIds.has(taskList.id)}
									onToggleSelect={selectionHandlers.handleToggleSelect}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				</div>
			)}
		</div>
	);
}
