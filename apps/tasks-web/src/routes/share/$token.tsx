import { cn } from "@appstandard/react-utils";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Loader,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Calendar,
	CheckCircle2,
	Download,
	ExternalLink,
	Flag,
	Layers,
	ListTodo,
	Loader2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

const BASE_URL = "https://tasks.appstandard.app";

export const Route = createFileRoute("/share/$token")({
	component: SharePage,
	loader: async ({ params }) => {
		const { token } = params;
		if (!token) return null;

		try {
			const typeDetection = await trpcClient.share.detectType.query({ token });

			if (!typeDetection?.type) return null;

			if (typeDetection.type === "single") {
				const info = await trpcClient.share.getInfoByToken.query({ token });
				return {
					type: "single" as const,
					taskListName: info.taskListName,
					taskCount: info.taskCount,
					shareName: info.shareName,
				};
			}

			if (typeDetection.type === "bundle") {
				const bundleInfo = await trpcClient.share.bundle.getInfoByToken.query({
					token,
				});
				return {
					type: "bundle" as const,
					bundleName: bundleInfo.bundleName,
					taskListCount: bundleInfo.taskListCount,
					totalTasks: bundleInfo.totalTasks,
				};
			}
		} catch {
			return null;
		}

		return null;
	},
	head: ({ loaderData, params }) => {
		const shareUrl = `${BASE_URL}/share/${params.token}`;

		let title = "Shared Task List - AppStandard Tasks";
		let description =
			"View this shared task list. Export to your favorite task manager.";

		if (loaderData) {
			if (loaderData.type === "single") {
				title = `${loaderData.taskListName} - Shared Task List - AppStandard Tasks`;
				description = `Task list "${loaderData.taskListName}" with ${loaderData.taskCount} task${loaderData.taskCount !== 1 ? "s" : ""}. Ready to view and export.`;
			} else if (loaderData.type === "bundle") {
				title = `${loaderData.bundleName || "Task Lists Bundle"} - AppStandard Tasks`;
				description = `Bundle "${loaderData.bundleName || "Tasks"}" with ${loaderData.taskListCount} list${loaderData.taskListCount !== 1 ? "s" : ""} and ${loaderData.totalTasks} total tasks.`;
			}
		}

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: shareUrl },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: shareUrl }],
		};
	},
});

function getErrorMessageForReason(reason: string): string {
	switch (reason) {
		case "not_found":
			return "This link is no longer available. It may have expired or been removed.";
		case "disabled":
			return "This link is no longer available. It may have been disabled.";
		case "expired":
			return "This link is no longer available. It may have expired.";
		default:
			return "This link is no longer available.";
	}
}

async function downloadShareAsICS(
	token: string,
	shareType: "single" | "bundle" | null,
): Promise<{ filename: string }> {
	let filename: string;
	let data: { icsContent: string; bundleName?: string; taskListName?: string };

	if (shareType === "bundle") {
		const bundleData = await trpcClient.share.bundle.getByToken.query({
			token,
		});
		data = {
			icsContent: bundleData.icsContent,
			bundleName: bundleData.bundleName ?? undefined,
		};
		filename = `${bundleData.bundleName || "tasks"}.ics`;
	} else {
		data = await trpcClient.share.getByToken.query({ token });
		filename = `${data.taskListName}.ics`;
	}

	const blob = new Blob([data.icsContent], { type: "text/calendar" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	return { filename };
}

function ShareErrorView({ errorMessage }: { errorMessage: string }) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-6 sm:py-10">
				<Card className="w-full">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
							<XCircle className="h-8 w-8 text-destructive" />
						</div>
						<CardTitle>Invalid link</CardTitle>
						<CardDescription>{errorMessage}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild variant="outline">
							<Link to="/">Back to home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function ShareLoadingView() {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-6 sm:py-10">
				<Loader size="xl" />
				<p className="mt-4 text-muted-foreground">Loading...</p>
			</div>
		</div>
	);
}

function getPriorityColor(priority: string | null) {
	switch (priority) {
		case "high":
			return "text-red-600 dark:text-red-400";
		case "medium":
			return "text-amber-600 dark:text-amber-400";
		case "low":
			return "text-blue-600 dark:text-blue-400";
		default:
			return "text-muted-foreground";
	}
}

function getStatusBadge(status: string) {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Completed
				</Badge>
			);
		case "IN_PROCESS":
			return (
				<Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
					In Progress
				</Badge>
			);
		case "CANCELLED":
			return (
				<Badge className="bg-slate-500/10 text-muted-foreground">
					Cancelled
				</Badge>
			);
		default:
			return <Badge variant="outline">To Do</Badge>;
	}
}

interface Task {
	id: string;
	title: string;
	description: string | null;
	status: string;
	priority: string | null;
	dueDate: string | null;
}

function TaskCard({ task }: { task: Task }) {
	return (
		<Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
			<div
				className={cn(
					"absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5",
					task.status === "COMPLETED"
						? "bg-emerald-500"
						: task.priority === "high"
							? "bg-red-500"
							: task.priority === "medium"
								? "bg-amber-500"
								: "bg-primary",
				)}
			/>
			<CardContent className="py-4 pr-4 pl-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							{getStatusBadge(task.status)}
							{task.priority && (
								<Flag
									className={cn("h-4 w-4", getPriorityColor(task.priority))}
								/>
							)}
						</div>
						<h3
							className={cn(
								"mt-2 font-medium",
								task.status === "COMPLETED" &&
									"text-muted-foreground line-through",
							)}
						>
							{task.title}
						</h3>
						{task.description && (
							<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
								{task.description}
							</p>
						)}
					</div>
					{task.dueDate && (
						<div className="flex items-center gap-1 text-muted-foreground text-xs">
							<Calendar className="h-3 w-3" />
							{format(new Date(task.dueDate), "MMM d", { locale: enUS })}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function useShareData(token: string | undefined) {
	const { data: typeDetection, isLoading: isDetectingType } = useQuery({
		queryKey: ["share", "detectType", token],
		queryFn: () => trpcClient.share.detectType.query({ token: token || "" }),
		enabled: !!token && token.length > 0,
		retry: false,
	});

	const shareType = typeDetection?.type ?? null;
	const detectionError =
		typeDetection && "reason" in typeDetection
			? (typeDetection.reason as string | undefined)
			: undefined;

	const {
		data: singleInfo,
		isLoading: isLoadingSingle,
		error: singleError,
	} = useQuery({
		queryKey: ["share", "info", token],
		queryFn: () =>
			trpcClient.share.getInfoByToken.query({ token: token || "" }),
		enabled: !!token && token.length > 0 && shareType === "single",
		retry: false,
	});

	const {
		data: bundleInfo,
		isLoading: isLoadingBundle,
		error: bundleError,
	} = useQuery({
		queryKey: ["share", "bundleInfo", token],
		queryFn: () =>
			trpcClient.share.bundle.getInfoByToken.query({ token: token || "" }),
		enabled: !!token && token.length > 0 && shareType === "bundle",
		retry: false,
	});

	// Tasks data is included in singleInfo, no separate query needed
	const tasksData = null;

	const isLoading = isDetectingType || isLoadingSingle || isLoadingBundle;

	let error: { message: string } | null = null;
	if (shareType === "single" && singleError) {
		error = singleError as { message: string };
	} else if (shareType === "bundle" && bundleError) {
		error = bundleError as { message: string };
	} else if (detectionError) {
		error = { message: getErrorMessageForReason(detectionError) };
	}

	return {
		shareType,
		isLoading,
		error,
		singleInfo,
		bundleInfo,
		tasksData,
	};
}

function SingleShareView({
	info,
	tasksData,
	downloadState,
	onDownload,
}: {
	info: {
		taskListName: string;
		shareName?: string | null;
		taskCount: number;
	};
	tasksData: { tasks: Task[]; taskListColor: string | null } | null;
	downloadState: "idle" | "loading" | "success" | "error";
	onDownload: () => void;
}) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
				<Card className="mb-6">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<ListTodo className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-2xl">{info.taskListName}</CardTitle>
						<CardDescription>
							{info.shareName && (
								<span className="mb-1 block text-sm">{info.shareName}</span>
							)}
							{info.taskCount} task{info.taskCount !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							This task list has been shared with you. Download it in .ics
							format to import it into your task manager.
						</p>

						<Button
							onClick={onDownload}
							className="w-full"
							size="lg"
							disabled={downloadState === "loading"}
						>
							{downloadState === "loading" ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Downloading...
								</>
							) : downloadState === "success" ? (
								<>
									<CheckCircle2 className="mr-2 h-5 w-5" />
									Downloaded!
								</>
							) : (
								<>
									<Download className="mr-2 h-5 w-5" />
									Download task list
								</>
							)}
						</Button>

						{downloadState === "success" && (
							<p className="text-center text-muted-foreground text-sm">
								The file has been downloaded. Open it with your task manager to
								import it.
							</p>
						)}

						<div className="border-t pt-4">
							<p className="mb-3 text-center text-muted-foreground text-xs">
								Compatible with:
							</p>
							<div className="flex flex-wrap justify-center gap-2 text-muted-foreground text-xs">
								<span className="rounded-full bg-muted px-3 py-1">
									Apple Reminders
								</span>
								<span className="rounded-full bg-muted px-3 py-1">Todoist</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Outlook Tasks
								</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Thunderbird
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{tasksData && tasksData.tasks.length > 0 && (
					<div className="space-y-4">
						<h2 className="font-semibold text-xl">Tasks</h2>
						<div className="space-y-3">
							{tasksData.tasks.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</div>
					</div>
				)}

				{tasksData && tasksData.tasks.length === 0 && (
					<Card>
						<CardContent className="py-10 text-center">
							<p className="text-muted-foreground">No tasks in this list</p>
						</CardContent>
					</Card>
				)}

				<div className="mt-8 text-center">
					<p className="text-muted-foreground text-sm">
						Need to create your own task lists?
					</p>
					<Button asChild variant="link" className="text-primary">
						<Link to="/">
							Discover AppStandard Tasks
							<ExternalLink className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function BundleShareView({
	bundleInfo,
	downloadState,
	onDownload,
}: {
	bundleInfo: {
		bundleName: string;
		taskListCount: number;
		totalTasks: number;
		taskLists: Array<{
			id: string;
			name: string;
			color?: string | null;
			taskCount: number;
		}>;
	};
	downloadState: "idle" | "loading" | "success" | "error";
	onDownload: () => void;
}) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
				<Card className="mb-6">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Layers className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-2xl">{bundleInfo.bundleName}</CardTitle>
						<CardDescription>
							{bundleInfo.taskListCount} task list
							{bundleInfo.taskListCount !== 1 ? "s" : ""} •{" "}
							{bundleInfo.totalTasks} task
							{bundleInfo.totalTasks !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							This bundle contains multiple task lists. Download them all
							together in a single .ics file.
						</p>

						<Button
							onClick={onDownload}
							className="w-full"
							size="lg"
							disabled={downloadState === "loading"}
						>
							{downloadState === "loading" ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Downloading...
								</>
							) : downloadState === "success" ? (
								<>
									<CheckCircle2 className="mr-2 h-5 w-5" />
									Downloaded!
								</>
							) : (
								<>
									<Download className="mr-2 h-5 w-5" />
									Download all task lists
								</>
							)}
						</Button>

						{downloadState === "success" && (
							<p className="text-center text-muted-foreground text-sm">
								The file has been downloaded. Open it with your task manager to
								import it.
							</p>
						)}

						{bundleInfo.taskLists.length > 0 && (
							<div className="border-t pt-4">
								<p className="mb-3 text-center font-medium text-sm">
									Task lists in this bundle:
								</p>
								<div className="space-y-2">
									{bundleInfo.taskLists.map((tl) => (
										<div
											key={tl.id}
											className="flex items-center justify-between rounded-lg border bg-card p-3"
										>
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: tl.color || "#D4A017" }}
												/>
												<span className="font-medium text-sm">{tl.name}</span>
												<span className="text-muted-foreground text-xs">
													({tl.taskCount} tasks)
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="border-t pt-4">
							<p className="mb-3 text-center text-muted-foreground text-xs">
								Compatible with:
							</p>
							<div className="flex flex-wrap justify-center gap-2 text-muted-foreground text-xs">
								<span className="rounded-full bg-muted px-3 py-1">
									Apple Reminders
								</span>
								<span className="rounded-full bg-muted px-3 py-1">Todoist</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Outlook Tasks
								</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Thunderbird
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="mt-8 text-center">
					<p className="text-muted-foreground text-sm">
						Need to create your own task lists?
					</p>
					<Button asChild variant="link" className="text-primary">
						<Link to="/">
							Discover AppStandard Tasks
							<ExternalLink className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function SharePage() {
	const { token } = Route.useParams();
	const [downloadState, setDownloadState] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	const { shareType, isLoading, error, singleInfo, bundleInfo, tasksData } =
		useShareData(token);

	const handleDownload = async () => {
		setDownloadState("loading");
		try {
			await downloadShareAsICS(token, shareType);
			setDownloadState("success");
			toast.success(
				shareType === "bundle"
					? "Task lists bundle downloaded!"
					: "Task list downloaded!",
			);
		} catch {
			setDownloadState("error");
			toast.error("Error during download");
		}
	};

	if (error && !isLoading) {
		return <ShareErrorView errorMessage={error.message} />;
	}

	if (isLoading) {
		return <ShareLoadingView />;
	}

	if (shareType === "bundle" && bundleInfo) {
		return (
			<BundleShareView
				bundleInfo={{
					bundleName: bundleInfo.bundleName ?? "",
					taskListCount: bundleInfo.taskListCount,
					totalTasks: bundleInfo.totalTasks,
					taskLists: bundleInfo.taskLists.map((tl) => ({
						id: tl.id,
						name: tl.name,
						color: tl.color ?? null,
						taskCount: tl.taskCount,
					})),
				}}
				downloadState={downloadState}
				onDownload={handleDownload}
			/>
		);
	}

	if (shareType === "single" && singleInfo) {
		return (
			<SingleShareView
				info={{
					taskListName: singleInfo.taskListName,
					shareName: singleInfo.shareName,
					taskCount: singleInfo.taskCount,
				}}
				tasksData={tasksData ?? null}
				downloadState={downloadState}
				onDownload={handleDownload}
			/>
		);
	}

	return null;
}
