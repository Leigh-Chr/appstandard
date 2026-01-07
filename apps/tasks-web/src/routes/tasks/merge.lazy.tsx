import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Merge } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTaskLists } from "@/hooks/use-task-lists";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpcClient } from "@/utils/trpc";

export const Route = createLazyFileRoute("/tasks/merge")({
	component: MergeTaskListsComponent,
});

function MergeTaskListsComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { taskLists } = useTaskLists();

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [mergedName, setMergedName] = useState("");
	const [removeDuplicates, setRemoveDuplicates] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");

	// Filter task lists by search keyword
	const filteredTaskLists = (() => {
		const listsArray = Array.isArray(taskLists) ? taskLists : [];
		if (!searchKeyword.trim()) {
			return listsArray;
		}
		const searchLower = searchKeyword.trim().toLowerCase();
		return listsArray.filter((list) =>
			list.name.toLowerCase().includes(searchLower),
		);
	})();

	const mergeMutation = useMutation({
		mutationFn: (data: {
			taskListIds: string[];
			name: string;
			removeDuplicates: boolean;
		}) => trpcClient.merge.merge.mutate(data),
		onSuccess: (data: {
			taskList: { id: string };
			mergedTasks: number;
			removedDuplicates: number;
		}) => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskList.list });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all });
			toast.success(
				`Task lists merged! ${data.mergedTasks} task(s), ${data.removedDuplicates} duplicate(s) removed.`,
			);
			navigate({ to: `/tasks/${data.taskList.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during merge";
			toast.error(message);
		},
	});

	const handleToggle = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const handleMerge = () => {
		if (selectedIds.size < 2) {
			toast.error("Select at least 2 task lists to merge");
			return;
		}

		if (!mergedName.trim()) {
			toast.error("Please enter a name for the merged task list");
			return;
		}

		mergeMutation.mutate({
			taskListIds: Array.from(selectedIds),
			name: mergedName.trim(),
			removeDuplicates,
		});
	};

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="transition-all duration-200 hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Merge className="h-5 w-5" />
							Merge task lists
						</CardTitle>
						<CardDescription>
							Combine multiple task lists into one
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Select task lists to merge (minimum 2)</Label>
							{taskLists && taskLists.length > 3 && (
								<div className="mb-2">
									<Input
										placeholder="Search task lists..."
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										aria-label="Search task lists to merge"
									/>
								</div>
							)}
							<div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
								{!taskLists || taskLists.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No task lists available
									</p>
								) : filteredTaskLists.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No task lists match your search
									</p>
								) : (
									filteredTaskLists.map(
										(list: { id: string; name: string; taskCount: number }) => (
											<div
												key={list.id}
												className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent"
											>
												<Checkbox
													id={list.id}
													checked={selectedIds.has(list.id)}
													onCheckedChange={() => handleToggle(list.id)}
												/>
												<Label
													htmlFor={list.id}
													className="flex-1 cursor-pointer font-normal text-sm"
												>
													{list.name} ({list.taskCount ?? 0} task
													{(list.taskCount ?? 0) !== 1 ? "s" : ""})
												</Label>
											</div>
										),
									)
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mergedName">Merged task list name</Label>
							<Input
								id="mergedName"
								value={mergedName}
								onChange={(e) => setMergedName(e.target.value)}
								placeholder="Merged tasks"
								disabled={mergeMutation.isPending}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="removeDuplicates"
								checked={removeDuplicates}
								onCheckedChange={(checked) => {
									setRemoveDuplicates(checked === true);
								}}
								disabled={mergeMutation.isPending}
							/>
							<Label
								htmlFor="removeDuplicates"
								className="cursor-pointer font-normal text-sm"
							>
								Remove duplicates (same title + same due date)
							</Label>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={handleMerge}
								disabled={
									selectedIds.size < 2 ||
									!mergedName.trim() ||
									mergeMutation.isPending
								}
								className="flex-1"
							>
								{mergeMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Merging...
									</>
								) : (
									"Merge"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/tasks" })}
								disabled={mergeMutation.isPending}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
