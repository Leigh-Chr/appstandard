import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import CheckEmail from "@/components/check-email";

const BASE_URL = "https://tasks.appstandard.app";

const checkEmailSearchSchema = z.object({
	email: z.string().optional(),
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/check-email")({
	component: CheckEmail,
	validateSearch: zodValidator(checkEmailSearchSchema),
	head: () => ({
		meta: [
			{ title: "Check Your Email - AppStandard Tasks" },
			{
				name: "description",
				content:
					"Check your email for a verification link to complete your AppStandard Tasks account setup.",
			},
			{ property: "og:title", content: "Check Your Email - AppStandard Tasks" },
			{ property: "og:url", content: `${BASE_URL}/check-email` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/check-email` }],
	}),
});
