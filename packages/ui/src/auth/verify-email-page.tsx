/**
 * Shared Verify Email Page Component
 * Callback page for email verification
 */

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SuccessAnimation } from "../animations/success-animation";
import { Button } from "../button";
import { Loader } from "../loader";
import type { BaseAuthFormProps } from "./types";

export interface VerifyEmailPageProps extends BaseAuthFormProps {
	/** Error from the URL (e.g., "invalid_token") */
	error?: string | undefined;
	/** Redirect path from the URL */
	redirect?: string | undefined;
	/** Login route path (default: "/login") */
	loginRoute?: string | undefined;
	/** Check email route path (default: "/check-email") */
	checkEmailRoute?: string | undefined;
	/** Home route path (default: "/") */
	homeRoute?: string | undefined;
	/** Default redirect after verification (default: main route) */
	defaultRedirect: string;
	/** localStorage key for storing redirect (default: "signup_redirect") */
	redirectStorageKey?: string | undefined;
}

export function VerifyEmailPage({
	authClient,
	navigate,
	showBackgroundEffects = true,
	error,
	redirect,
	loginRoute = "/login",
	checkEmailRoute = "/check-email",
	homeRoute = "/",
	defaultRedirect,
	redirectStorageKey = "signup_redirect",
}: VerifyEmailPageProps) {
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		// If no error, verification succeeded
		// Better-Auth has already verified the email and created the session
		if (!error) {
			setShowSuccess(true);
			// Refresh session to get updated data
			void authClient.getSession();
			// Get redirect from localStorage (stored during signup) or from URL
			const storedRedirect = localStorage.getItem(redirectStorageKey);
			const finalRedirect = redirect || storedRedirect || defaultRedirect;
			// Clean up localStorage after use
			if (storedRedirect) {
				localStorage.removeItem(redirectStorageKey);
			}
			// Redirect after animation
			const timer = setTimeout(() => {
				navigate({ to: finalRedirect });
			}, 2000);
			return () => clearTimeout(timer);
		}
		// Verification error (invalid or expired token)
		toast.error("Email verification failed. The link may have expired.");
		return undefined;
	}, [
		error,
		navigate,
		redirect,
		authClient,
		defaultRedirect,
		redirectStorageKey,
	]);

	// Show loader during processing
	if (!error && !showSuccess) {
		return (
			<div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
				{/* Background effects */}
				{showBackgroundEffects && (
					<div className="pointer-events-none absolute inset-0 -z-10">
						<div className="aurora absolute inset-0 opacity-50" />
						<div className="dot-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,#000_40%,transparent_100%)]" />
					</div>
				)}
				<div className="text-center">
					<Loader />
					<p className="mt-4 text-muted-foreground">Verifying your email...</p>
				</div>
			</div>
		);
	}

	// Show success animation
	if (!error && showSuccess) {
		return (
			<>
				<SuccessAnimation
					show={showSuccess}
					type="success"
					message="Email verified successfully!"
					onComplete={() => {
						setShowSuccess(false);
					}}
				/>
				<div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
					{/* Background effects */}
					{showBackgroundEffects && (
						<div className="pointer-events-none absolute inset-0 -z-10">
							<div className="aurora absolute inset-0 opacity-50" />
							<div className="dot-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,#000_40%,transparent_100%)]" />
						</div>
					)}
					<div className="w-full max-w-md">
						<div
							className={`rounded-xl border p-6 text-center shadow-sm ${showBackgroundEffects ? "bg-card/80 shadow-black/5 shadow-xl backdrop-blur-sm" : "bg-card"}`}
						>
							<div className="mb-4 flex justify-center">
								<CheckCircle2 className="h-16 w-16 text-green-500" />
							</div>
							<h1 className="font-bold text-2xl">Email Verified!</h1>
							<p className="mt-2 text-muted-foreground">
								Your account has been verified. Redirecting...
							</p>
						</div>
					</div>
				</div>
			</>
		);
	}

	// Show error with consistent design
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
				<div
					className={`rounded-xl border p-6 text-center shadow-sm ${showBackgroundEffects ? "bg-card/80 shadow-black/5 shadow-xl backdrop-blur-sm" : "bg-card"}`}
				>
					<div className="mb-4 flex justify-center">
						<XCircle className="h-16 w-16 text-destructive" />
					</div>
					<h1 className="font-bold text-2xl">Verification Failed</h1>
					<p className="mt-2 text-muted-foreground">
						{error === "invalid_token"
							? "The verification link is invalid or has expired. Please request a new verification email."
							: "An error occurred during email verification."}
					</p>
					<div className="mt-6 space-y-2">
						<Button
							onClick={() => {
								navigate({ to: loginRoute });
							}}
							className="w-full"
						>
							Go to Login
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								navigate({ to: checkEmailRoute });
							}}
							className="w-full"
						>
							Request New Verification Email
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								navigate({ to: homeRoute });
							}}
							className="w-full"
						>
							Go to Home
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
