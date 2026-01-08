import { useFileHandler } from "@appstandard/react-utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileDropZone } from "@/components/file-drop-zone";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpcClient } from "@/utils/trpc";

export const Route = createLazyFileRoute("/tasks/import")({
	component: ImportTaskListComponent,
});

function ImportTaskListComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// File import state
	const [fileContent, setFileContent] = useState<string | null>(null);
	const [taskListName, setTaskListName] = useState("");
	const [taskCount, setTaskCount] = useState(0);
	const [launchQueueFile, setLaunchQueueFile] = useState<File | null>(null);

	// URL import state
	const [url, setUrl] = useState("");
	const [urlTaskListName, setUrlTaskListName] = useState("");

	// Handle files opened via PWA file handler (launchQueue API)
	useFileHandler({
		onFiles: async (files) => {
			const file = files[0];
			if (!file) return;
			setLaunchQueueFile(file);
			// Suggest name from file name
			const suggestedName = file.name
				.replace(/\.ics$/i, "")
				.replace(/[-_]/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());
			setTaskListName(suggestedName);
			// Read file content
			const content = await file.text();
			setFileContent(content);
			toast.info(`File "${file.name}" ready to import`);
		},
		immediate: true,
	});

	// Process launch queue file when it's set
	useEffect(() => {
		if (launchQueueFile && fileContent) {
			// File is ready, user can click import
			setLaunchQueueFile(null);
		}
	}, [launchQueueFile, fileContent]);

	const importMutation = useMutation({
		mutationFn: (data: { fileContent: string; name?: string }) =>
			trpcClient.taskList.create
				.mutate({ name: data.name || "Imported Tasks" })
				.then(async (taskList) => {
					const result = await trpcClient.import.importIntoTaskList.mutate({
						taskListId: taskList.id,
						fileContent: data.fileContent,
						removeDuplicates: false,
					});
					return { taskList, ...result };
				}),
		onSuccess: (data: { taskList: { id: string }; importedTasks: number }) => {
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.taskList.list,
			});
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.dashboard.all,
			});
			toast.success(`Task list imported! ${data.importedTasks} tasks ready.`);
			navigate({ to: `/tasks/${data.taskList.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during import";
			toast.error(message);
		},
	});

	const importFromUrlMutation = useMutation({
		mutationFn: (data: { url: string; name?: string }) =>
			trpcClient.import.importFromUrl.mutate(data),
		onSuccess: (data: { taskList: { id: string }; importedTasks: number }) => {
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.taskList.list,
			});
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.dashboard.all,
			});
			toast.success(`Task list imported! ${data.importedTasks} tasks ready.`);
			navigate({ to: `/tasks/${data.taskList.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during import";
			toast.error(message);
		},
	});

	const handleFileSelect = (file: File) => {
		// Suggest name from file name
		const suggestedName = file.name
			.replace(/\.ics$/i, "")
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
		if (!taskListName) {
			setTaskListName(suggestedName);
		}
	};

	const handlePreviewParsed = (tasks: Array<{ title: string }>) => {
		setTaskCount(tasks.length);
	};

	const handleImport = async () => {
		if (!fileContent) {
			toast.error("Please select a file");
			return;
		}

		importMutation.mutate({
			fileContent,
			name: taskListName || undefined,
		});
	};

	const handleImportFromUrl = () => {
		if (!url.trim()) {
			toast.error("Please enter a URL");
			return;
		}

		importFromUrlMutation.mutate({
			url: url.trim(),
			name: urlTaskListName || undefined,
		});
	};

	const isPending = importMutation.isPending || importFromUrlMutation.isPending;

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="transition-all duration-200 hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Import a task list
						</CardTitle>
						<CardDescription>
							Import tasks from a file or URL. Works with Apple Reminders,
							Todoist, and all iCalendar formats.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="file" className="w-full">
							<TabsList className="mb-6 grid w-full grid-cols-2">
								<TabsTrigger value="file" disabled={isPending}>
									<Upload className="mr-2 h-4 w-4" />
									From a file
								</TabsTrigger>
								<TabsTrigger value="url" disabled={isPending}>
									<Globe className="mr-2 h-4 w-4" />
									From a URL
								</TabsTrigger>
							</TabsList>

							{/* File import tab */}
							<TabsContent value="file" className="space-y-6">
								<FileDropZone
									onFileSelect={handleFileSelect}
									onFileContent={setFileContent}
									onPreviewParsed={handlePreviewParsed}
									disabled={isPending}
								/>

								{fileContent && (
									<div className="space-y-2">
										<Label htmlFor="name">Task list name</Label>
										<Input
											id="name"
											value={taskListName}
											onChange={(e) => setTaskListName(e.target.value)}
											placeholder="My imported tasks"
											disabled={isPending}
										/>
										<p className="text-muted-foreground text-xs">
											Leave empty to use the file name
										</p>
									</div>
								)}

								<div className="flex gap-2">
									<Button
										onClick={handleImport}
										disabled={!fileContent || isPending}
										className="interactive-glow flex-1"
									>
										{importMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Importing...
											</>
										) : (
											<>
												Import
												{taskCount > 0 && ` (${taskCount} tasks)`}
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={() => navigate({ to: "/tasks" })}
										disabled={isPending}
									>
										Cancel
									</Button>
								</div>
							</TabsContent>

							{/* URL import tab */}
							<TabsContent value="url" className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="url">Task list URL</Label>
									<Input
										id="url"
										type="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										placeholder="https://example.com/tasks.ics"
										disabled={isPending}
									/>
									<p className="text-muted-foreground text-xs">
										Paste the public URL of your task list (ICS/iCal format)
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="url-name">Task list name (optional)</Label>
									<Input
										id="url-name"
										value={urlTaskListName}
										onChange={(e) => setUrlTaskListName(e.target.value)}
										placeholder="My tasks"
										disabled={isPending}
									/>
								</div>

								{/* Help text */}
								<div className="rounded-lg bg-muted/50 p-4 text-sm">
									<p className="mb-2 font-medium">
										Where to find your task list URL?
									</p>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
										<li>
											<strong>Apple Reminders</strong>: Share list → Copy link
										</li>
										<li>
											<strong>Todoist</strong>: Project settings → Integrations
											→ Calendar feed
										</li>
										<li>
											<strong>Other apps</strong>: Look for an export or share
											option with ICS format
										</li>
									</ul>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={handleImportFromUrl}
										disabled={!url.trim() || isPending}
										className="flex-1"
									>
										{importFromUrlMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Importing...
											</>
										) : (
											<>
												<Globe className="mr-2 h-4 w-4" />
												Import from URL
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={() => navigate({ to: "/tasks" })}
										disabled={isPending}
									>
										Cancel
									</Button>
								</div>

								<p className="text-center text-muted-foreground text-xs">
									You will be able to refresh this task list from the URL later
								</p>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
