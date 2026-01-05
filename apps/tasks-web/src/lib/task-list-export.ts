/**
 * Task list export utilities
 */

import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

/**
 * Export group as ICS file
 */
export async function exportGroupAsICSFile(groupId: string): Promise<void> {
	const group = await trpcClient.group.getById.query({
		id: groupId,
	});
	const taskListsArray = Array.isArray(group.taskLists) ? group.taskLists : [];
	if (taskListsArray.length === 0) {
		toast.error("No task lists to export");
		return;
	}

	const bundle = await trpcClient.share.bundle.create.mutate({
		groupId: groupId,
		removeDuplicates: false,
	});

	const data = await trpcClient.share.bundle.getByToken.query({
		token: bundle.token,
	});

	const blob = new Blob([data.icsContent], { type: "text/calendar" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${group.name.replace(/[^a-z0-9]/gi, "_")}.ics`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	await trpcClient.share.bundle.delete.mutate({ id: bundle.id });
}

/**
 * Export multiple task lists as ICS file
 */
export async function exportTaskListsAsICSFile(
	taskListIds: string[],
	bundleName?: string | undefined,
): Promise<void> {
	if (taskListIds.length === 0) {
		toast.error("No task lists to export");
		return;
	}

	const bundle = await trpcClient.share.bundle.create.mutate({
		taskListIds,
		name: bundleName,
		removeDuplicates: false,
	});

	const data = await trpcClient.share.bundle.getByToken.query({
		token: bundle.token,
	});

	const blob = new Blob([data.icsContent], { type: "text/calendar" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	const filename = bundleName
		? `${bundleName.replace(/[^a-z0-9]/gi, "_")}.ics`
		: `tasks_${new Date().toISOString().slice(0, 10)}.ics`;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	await trpcClient.share.bundle.delete.mutate({ id: bundle.id });
}
