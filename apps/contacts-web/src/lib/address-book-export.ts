/**
 * Address book export utilities
 */

import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

/**
 * Export group as VCF file
 */
export async function exportGroupAsVCFFile(groupId: string): Promise<void> {
	const group = await trpcClient.group.getById.query({
		id: groupId,
	});
	const addressBooksArray = Array.isArray(group.addressBooks)
		? group.addressBooks
		: [];
	if (addressBooksArray.length === 0) {
		toast.error("No address books to export");
		return;
	}

	const bundle = await trpcClient.share.bundle.create.mutate({
		groupId: groupId,
		removeDuplicates: false,
	});

	const data = await trpcClient.share.bundle.getByToken.query({
		token: bundle.token,
	});

	const blob = new Blob([data.vcardContent], { type: "text/vcard" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${group.name.replace(/[^a-z0-9]/gi, "_")}.vcf`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	await trpcClient.share.bundle.delete.mutate({ id: bundle.id });
}

/**
 * Export multiple address books as VCF file
 */
export async function exportAddressBooksAsVCFFile(
	addressBookIds: string[],
	bundleName?: string | undefined,
): Promise<void> {
	if (addressBookIds.length === 0) {
		toast.error("No address books to export");
		return;
	}

	const bundle = await trpcClient.share.bundle.create.mutate({
		addressBookIds,
		name: bundleName,
		removeDuplicates: false,
	});

	const data = await trpcClient.share.bundle.getByToken.query({
		token: bundle.token,
	});

	const blob = new Blob([data.vcardContent], { type: "text/vcard" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	const filename = bundleName
		? `${bundleName.replace(/[^a-z0-9]/gi, "_")}.vcf`
		: `contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	await trpcClient.share.bundle.delete.mutate({ id: bundle.id });
}
