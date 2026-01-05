import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import ResetPassword from "@/components/reset-password";

const BASE_URL = "https://appstandard.app";

const resetPasswordSearchSchema = z.object({
	token: z.string().optional(), // Token de réinitialisation depuis l'URL
	error: z.string().optional(), // "INVALID_TOKEN" si le token est invalide
});

export const Route = createFileRoute("/reset-password")({
	component: ResetPassword,
	validateSearch: zodValidator(resetPasswordSearchSchema),
	head: () => ({
		meta: [
			{ title: "Reset Password - AppStandard Calendar" },
			{
				name: "description",
				content: "Set a new password for your AppStandard Calendar account.",
			},
			{
				property: "og:title",
				content: "Reset Password - AppStandard Calendar",
			},
			{ property: "og:url", content: `${BASE_URL}/reset-password` },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/reset-password` }],
	}),
});
