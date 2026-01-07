import { createFileRoute } from "@tanstack/react-router";
import { trpcClient } from "@/utils/trpc";

const BASE_URL = "https://appstandard.app";

export const Route = createFileRoute("/share/$token")({
	loader: async ({ params }) => {
		const { token } = params;
		if (!token) return null;

		// Try to get share info for meta tags (non-blocking, don't throw errors)
		try {
			// Detect type first
			const typeDetection = await trpcClient.share.detectType.query({
				token,
			});

			if (!typeDetection?.type) return null;

			// Get info based on type
			if (typeDetection.type === "single") {
				const info = await trpcClient.share.getInfoByToken.query({
					token,
				});
				return {
					type: "single" as const,
					calendarName: info.calendarName,
					eventCount: info.eventCount,
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
					calendarCount: bundleInfo.calendarCount,
					totalEvents: bundleInfo.totalEvents,
				};
			}
		} catch {
			// Silently fail - use default meta tags
			return null;
		}

		return null;
	},
	head: ({ loaderData, params }) => {
		const shareUrl = `${BASE_URL}/share/${params.token}`;

		// Default meta tags
		let title = "Shared calendar - AppStandard Calendar";
		let description =
			"Download this shared calendar in .ics format. Works with all calendar applications.";

		// Use loader data if available
		if (loaderData) {
			if (loaderData.type === "single") {
				title = `${loaderData.calendarName} - Shared Calendar - AppStandard Calendar`;
				description = `Calendar "${loaderData.calendarName}" with ${loaderData.eventCount} event${loaderData.eventCount !== 1 ? "s" : ""}. Ready to download—works with Google Calendar, Apple Calendar, Outlook, and more.`;
			} else if (loaderData.type === "bundle") {
				title = `${loaderData.bundleName || "Calendars Bundle"} - Shared Bundle - AppStandard Calendar`;
				description = `Bundle "${loaderData.bundleName || "Calendars"}" with ${loaderData.calendarCount} calendar${loaderData.calendarCount !== 1 ? "s" : ""} and ${loaderData.totalEvents} total events. Ready to download—works with Google Calendar, Apple Calendar, Outlook, and more.`;
			}
		}

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				// Open Graph
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: shareUrl },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:image", content: `${BASE_URL}/og-image.png` },
				// Twitter Card
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:url", content: shareUrl },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
				{ name: "twitter:image", content: `${BASE_URL}/og-image.png` },
			],
			links: [{ rel: "canonical", href: shareUrl }],
		};
	},
});
