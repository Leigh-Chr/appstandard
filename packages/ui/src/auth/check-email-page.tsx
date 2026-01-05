/**
 * Shared Check Email Page Component
 * Prompt page for email verification after signup
 */

import { Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../button";
import type { BaseAuthFormProps } from "./types";

export interface CheckEmailPageProps extends BaseAuthFormProps {
	/** Email address from the URL */
	email?: string | undefined;
	/** Redirect path from the URL */
	redirect?: string | undefined;
	/** Login route path (default: "/login") */
	loginRoute?: string | undefined;
	/** Verify email callback route path (default: "/verify-email") */
	verifyEmailRoute?: string | undefined;
	/** localStorage key for storing redirect (default: "signup_redirect") */
	redirectStorageKey?: string | undefined;
}

export function CheckEmailPage({
	authClient,
	navigate,
	showBackgroundEffects = true,
	email = "",
	redirect = "",
	loginRoute = "/login",
	verifyEmailRoute = "/verify-email",
	redirectStorageKey = "signup_redirect",
}: CheckEmailPageProps) {
	const [isResending, setIsResending] = useState(false);

	const handleResendEmail = async () => {
		if (!email) {
			toast.error("Email address not found. Please try signing up again.");
			return;
		}

		// Store the redirect in localStorage for retrieval after verification
		if (redirect) {
			localStorage.setItem(redirectStorageKey, redirect);
		}

		setIsResending(true);
		try {
			await authClient.sendVerificationEmail?.({
				email,
				callbackURL: verifyEmailRoute,
			});
			toast.success("Verification email sent! Please check your inbox.");
		} catch (error: unknown) {
			const errorData = error as {
				error?: { message?: string; status?: number };
			};
			const status = errorData?.error?.status;

			if (status === 429) {
				toast.error(
					"Too many requests. Please wait a moment before trying again.",
				);
			} else {
				toast.error("Failed to send verification email. Please try again.");
			}
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
			{/* Background effects */}
			{showBackgroundEffects && (
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="aurora absolute inset-0 opacity-50" />
					<div className="dot-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,#000_40%,transparent_100%)]" />
				</div>
			)}

			<div className="w-full max-w-md">
				{/* Logo/Brand */}
				<div className="mb-8 flex flex-col items-center">
					<div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/20">
						<Mail className="size-7 text-primary" />
					</div>
					<h1 className="text-center font-bold text-3xl">Check your email</h1>
					<p className="mt-2 flex items-center gap-2 text-center text-muted-foreground text-sm">
						<Sparkles className="size-4 text-primary" />
						We've sent you a verification link
					</p>
				</div>

				{/* Content card */}
				<div
					className={`rounded-xl border p-6 shadow-sm ${showBackgroundEffects ? "bg-card/80 shadow-black/5 shadow-xl backdrop-blur-sm" : "bg-card"}`}
				>
					<div className="space-y-4 text-center">
						<p className="text-muted-foreground">
							We've sent a verification link to your email address.
						</p>
						{email && (
							<p className="font-medium text-foreground text-sm">{email}</p>
						)}
						<p className="text-muted-foreground text-sm">
							Click the link in the email to verify your account and complete
							your registration.
						</p>
						<p className="text-muted-foreground text-xs">
							<strong>Tip:</strong> Don't see the email? Check your spam or junk
							folder.
						</p>
						<div className="space-y-2 pt-2">
							<Button
								variant="outline"
								onClick={handleResendEmail}
								disabled={isResending || !email}
								className="w-full"
							>
								{isResending ? "Sending..." : "Resend verification email"}
							</Button>
							<Button
								variant="ghost"
								onClick={() => {
									navigate({ to: loginRoute });
								}}
								className="w-full"
							>
								Back to Login
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
