import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import {
	type TaskFormData,
	TaskFormExtended,
} from "@/components/task-form-extended";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/tasks/$taskListId/tasks/new")({
	component: NewTaskComponent,
	head: () => ({
		meta: [
			{ title: "New task - AppStandard Tasks" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function NewTaskComponent() {
	const { taskListId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [_serverValidationErrors, setServerValidationErrors] = useState<
		Record<string, string[]> | undefined
	>();

	const { data: taskList } = useQuery({
		...trpc.taskList.getById.queryOptions({ id: taskListId }),
	});

	const createMutation = useMutation(
		trpc.task.create.mutationOptions({
			onSuccess: () => {
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
				toast.success("Task created successfully");
				navigate({ to: `/tasks/${taskListId}` });
			},
			onError: (error: unknown) => {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Error creating task");
				}
			},
		}),
	);

	const handleSubmit = (data: TaskFormData) => {
		setServerValidationErrors(undefined);
		createMutation.mutate({
			taskListId,
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
		});
	};

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-10">
				<Breadcrumb
					items={[
						{
							label: taskList?.name || "Task List",
							href: `/tasks/${taskListId}`,
						},
						{ label: "New task" },
					]}
				/>

				<TaskFormExtended
					mode="create"
					onSubmit={handleSubmit}
					onCancel={() => navigate({ to: `/tasks/${taskListId}` })}
					isSubmitting={createMutation.isPending}
					taskListId={taskListId}
				/>
			</div>
		</div>
	);
}
