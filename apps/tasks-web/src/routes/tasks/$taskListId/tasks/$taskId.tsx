import { indexTask } from "@appstandard/react-utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Loader,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { QRCodeTaskButton } from "@/components/qr-code-task-button";
import {
	type TaskFormData,
	TaskFormExtended,
} from "@/components/task-form-extended";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Transform task data from API to form data
 */
function transformTaskToFormData(
	task: NonNullable<ReturnType<typeof useTask>["task"]>,
): Partial<TaskFormData> {
	return {
		title: task.title,
		description: task.description || undefined,
		status: task.status as TaskFormData["status"],
		priority: task.priority || undefined,
		percentComplete: task.percentComplete || 0,
		dueDate: task.dueDate
			? new Date(task.dueDate).toISOString().split("T")[0]
			: undefined,
		startDate: task.startDate
			? new Date(task.startDate).toISOString().split("T")[0]
			: undefined,
		location: task.location || undefined,
		url: task.url || undefined,
		categories: task.categories?.map((c) => c.category).join(", ") || undefined,
		color: task.color || undefined,
	};
}

function useTask(taskId: string) {
	const { data: task, isLoading } = useQuery({
		...trpc.task.getById.queryOptions({ id: taskId }),
		enabled: !!taskId,
	});
	return { task, isLoading };
}

/**
 * Loading state component
 */
function LoadingState() {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
			<div className="flex items-center justify-center py-12">
				<Loader size="lg" />
			</div>
		</div>
	);
}

/**
 * Not found state component
 */
function NotFoundState() {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
			<div className="text-center text-muted-foreground">Task not found</div>
		</div>
	);
}

/**
 * Duplicate Dialog Component
 */
function DuplicateDialog({
	open,
	onOpenChange,
	onDuplicate,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDuplicate: () => void;
	isPending: boolean;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Duplicate task</AlertDialogTitle>
					<AlertDialogDescription>
						Create a copy of this task.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDuplicate} disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Duplicating...
							</>
						) : (
							"Duplicate"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export const Route = createFileRoute("/tasks/$taskListId/tasks/$taskId")({
	component: EditTaskComponent,
	head: () => ({
		meta: [
			{ title: "Edit task - AppStandard Tasks" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function EditTaskComponent() {
	const { taskListId, taskId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

	const { task, isLoading } = useTask(taskId);

	const { data: taskList } = useQuery({
		...trpc.taskList.getById.queryOptions({ id: taskListId }),
	});

	const duplicateMutation = useMutation(
		trpc.task.duplicate.mutationOptions({
			onSuccess: (duplicatedTask) => {
				void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(taskListId),
				});
				toast.success("Task duplicated successfully");
				setDuplicateDialogOpen(false);
				// Navigate to the new task
				navigate({
					to: `/tasks/${taskListId}/tasks/${duplicatedTask.id}`,
				});
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during duplication";
				toast.error(message);
			},
		}),
	);

	const handleDuplicate = () => {
		duplicateMutation.mutate({ id: taskId });
	};

	const updateMutation = useMutation(
		trpc.task.update.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(taskListId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				// Update OS content index
				if (variables.title) {
					void indexTask({
						id: variables.id,
						summary: variables.title,
						description: variables.description || undefined,
					});
				}
				toast.success("Task updated successfully");
				navigate({ to: `/tasks/${taskListId}` });
			},
			onError: (error: unknown) => {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Error updating task");
				}
			},
		}),
	);

	const handleSubmit = (data: TaskFormData) => {
		// Filter out empty attendees and ensure required fields
		const validAttendees = data.attendees?.filter((a) => a.email?.trim());
		// Filter out empty alarms and ensure required action type
		const validAlarms = data.alarms
			?.filter((a) => a.trigger?.trim())
			.map((a) => ({
				trigger: a.trigger,
				action: a.action as "DISPLAY" | "EMAIL" | "AUDIO",
			}));

		updateMutation.mutate({
			id: taskId,
			title: data.title,
			description: data.description,
			status: data.status,
			priority: data.priority,
			percentComplete: data.percentComplete,
			dueDate: data.dueDate,
			startDate: data.startDate,
			location: data.location,
			url: data.url,
			categories: data.categories,
			color: data.color,
			rrule: data.rrule,
			relatedTo: data.relatedTo,
			attendees:
				validAttendees && validAttendees.length > 0
					? validAttendees.map((a) => ({
							email: a.email,
							name: a.name || undefined,
							role: a.role as
								| "CHAIR"
								| "REQ_PARTICIPANT"
								| "OPT_PARTICIPANT"
								| "NON_PARTICIPANT"
								| undefined,
							status: a.status as
								| "NEEDS_ACTION"
								| "ACCEPTED"
								| "DECLINED"
								| "TENTATIVE"
								| "DELEGATED"
								| undefined,
							rsvp: a.rsvp,
						}))
					: undefined,
			alarms: validAlarms && validAlarms.length > 0 ? validAlarms : undefined,
		});
	};

	if (isLoading) {
		return <LoadingState />;
	}

	if (!task) {
		return <NotFoundState />;
	}

	const initialData = transformTaskToFormData(task);

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-4xl space-y-4 px-4 py-6 sm:py-10">
				<div className="flex items-center justify-between">
					<Breadcrumb
						items={[
							{
								label: taskList?.name || "Task List",
								href: `/tasks/${taskListId}`,
							},
							{ label: task?.title || "Task" },
						]}
					/>
					<div className="flex items-center gap-2">
						<QRCodeTaskButton
							task={task}
							taskListName={taskList?.name || "Tasks"}
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDuplicateDialogOpen(true)}
						>
							<Copy className="mr-2 h-4 w-4" />
							Duplicate
						</Button>
					</div>
				</div>

				<TaskFormExtended
					mode="edit"
					initialData={initialData}
					onSubmit={handleSubmit}
					onCancel={() => navigate({ to: `/tasks/${taskListId}` })}
					isSubmitting={updateMutation.isPending}
					taskListId={taskListId}
				/>

				<DuplicateDialog
					open={duplicateDialogOpen}
					onOpenChange={setDuplicateDialogOpen}
					onDuplicate={handleDuplicate}
					isPending={duplicateMutation.isPending}
				/>
			</div>
		</div>
	);
}
