import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import VerifyEmail from "@/components/verify-email";

const BASE_URL = "https://contacts.appstandard.io";

const verifyEmailSearchSchema = z.object({
	error: z.string().optional(),
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
	component: VerifyEmail,
	validateSearch: zodValidator(verifyEmailSearchSchema),
	head: () => ({
		meta: [
			{ title: "Verify Email - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Verify your email address to complete your AppStandard Contacts account setup.",
			},
			{ property: "og:title", content: "Verify Email - AppStandard Contacts" },
			{ property: "og:url", content: `${BASE_URL}/verify-email` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/verify-email` }],
	}),
});
