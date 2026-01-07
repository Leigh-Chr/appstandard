import { createFileRoute } from "@tanstack/react-router";
import { trpcClient } from "@/utils/trpc";

const BASE_URL = "https://contacts.appstandard.app";

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
					addressBookName: info.addressBookName,
					contactCount: info.contactCount,
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
					addressBookCount: bundleInfo.addressBookCount,
					totalContacts: bundleInfo.totalContacts,
				};
			}
		} catch {
			return null;
		}

		return null;
	},
	head: ({ loaderData, params }) => {
		const shareUrl = `${BASE_URL}/share/${params.token}`;

		let title = "Shared Address Book - AppStandard Contacts";
		let description =
			"View this shared address book. Export contacts as vCard.";

		if (loaderData) {
			if (loaderData.type === "single") {
				title = `${loaderData.addressBookName} - Shared Address Book - AppStandard Contacts`;
				description = `Address book "${loaderData.addressBookName}" with ${loaderData.contactCount} contact${loaderData.contactCount !== 1 ? "s" : ""}. Ready to view and export as vCard.`;
			} else if (loaderData.type === "bundle") {
				title = `${loaderData.bundleName || "Address Books Bundle"} - AppStandard Contacts`;
				description = `Bundle "${loaderData.bundleName || "Contacts"}" with ${loaderData.addressBookCount} address book${loaderData.addressBookCount !== 1 ? "s" : ""} and ${loaderData.totalContacts} total contacts.`;
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
