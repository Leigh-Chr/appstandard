import { createFileRoute } from "@tanstack/react-router";
import { trpcClient } from "@/utils/trpc";

const BASE_URL = "https://tasks.appstandard.io";

export const Route = createFileRoute("/share/$token")({
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
