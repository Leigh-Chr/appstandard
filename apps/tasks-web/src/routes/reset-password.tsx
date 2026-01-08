import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import ResetPassword from "@/components/reset-password";

const BASE_URL = "https://tasks.appstandard.io";

const resetPasswordSearchSchema = z.object({
	token: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
	component: ResetPassword,
	validateSearch: zodValidator(resetPasswordSearchSchema),
	head: () => ({
		meta: [
			{ title: "Reset Password - AppStandard Tasks" },
			{
				name: "description",
				content: "Set a new password for your AppStandard Tasks account.",
			},
			{ property: "og:title", content: "Reset Password - AppStandard Tasks" },
			{ property: "og:url", content: `${BASE_URL}/reset-password` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/reset-password` }],
	}),
});
