/**
 * Dialog for moving task(s) to another task list
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTaskLists } from "@/hooks/use-task-lists";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface MoveTaskDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	taskIds: string[];
	currentTaskListId: string;
	taskCount?: number;
}

export function MoveTaskDialog({
	open,
	onOpenChange,
	taskIds,
	currentTaskListId,
	taskCount = taskIds.length,
}: MoveTaskDialogProps) {
	const queryClient = useQueryClient();
	const [targetTaskListId, setTargetTaskListId] = useState<string>("");

	// Get task lists for move destination
	const { taskLists, isLoading: isLoadingTaskLists } = useTaskLists();

	// Bulk move mutation
	const bulkMoveMutation = useMutation(
		trpc.task.bulkMove.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(
					`${data.movedCount} task(s) moved to "${data.targetTaskListName}"`,
				);
				onOpenChange(false);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during move";
				toast.error(message);
			},
		}),
	);

	const handleMove = () => {
		if (!targetTaskListId) return;
		bulkMoveMutation.mutate({
			taskIds,
			targetTaskListId,
		});
	};

	// Filter task lists to exclude current one
	const moveDestinations = Array.isArray(taskLists)
		? taskLists.filter((tl) => tl.id !== currentTaskListId)
		: [];

	const isPending = bulkMoveMutation.isPending;
	const canMove =
		targetTaskListId &&
		!isPending &&
		moveDestinations &&
		moveDestinations.length > 0;

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setTargetTaskListId("");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Move {taskCount === 1 ? "task" : `${taskCount} tasks`}
					</DialogTitle>
					<DialogDescription>
						Select the destination task list for{" "}
						{taskCount === 1 ? "this task" : "these tasks"}.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{isLoadingTaskLists ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : !moveDestinations || moveDestinations.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
							<CheckSquare className="h-8 w-8 text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								No other task lists available. Create a task list first.
							</p>
						</div>
					) : (
						<Select
							value={targetTaskListId}
							onValueChange={setTargetTaskListId}
							disabled={isPending}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select destination task list..." />
							</SelectTrigger>
							<SelectContent>
								{moveDestinations.map((tl) => (
									<SelectItem key={tl.id} value={tl.id}>
										<div className="flex items-center gap-2">
											{tl.color && (
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: tl.color }}
												/>
											)}
											<span>{tl.name}</span>
											<span className="text-muted-foreground text-xs">
												({tl.taskCount} task{tl.taskCount !== 1 ? "s" : ""})
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleMove} disabled={!canMove}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Moving...
							</>
						) : (
							<>
								<ArrowRight className="mr-2 h-4 w-4" />
								Move
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
