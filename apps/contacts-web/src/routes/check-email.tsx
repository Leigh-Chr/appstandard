import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import CheckEmail from "@/components/check-email";

const BASE_URL = "https://contacts.appstandard.io";

const checkEmailSearchSchema = z.object({
	email: z.string().email().optional(),
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/check-email")({
	component: CheckEmail,
	validateSearch: zodValidator(checkEmailSearchSchema),
	head: () => ({
		meta: [
			{ title: "Check Your Email - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Please check your email to verify your AppStandard Contacts account.",
			},
			{
				property: "og:title",
				content: "Check Your Email - AppStandard Contacts",
			},
			{ property: "og:url", content: `${BASE_URL}/check-email` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/check-email` }],
	}),
});
