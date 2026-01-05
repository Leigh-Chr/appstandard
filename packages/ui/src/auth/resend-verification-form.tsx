/**
 * Shared Resend Verification Form Component
 * For resending email verification links
 */

import { useForm } from "@tanstack/react-form";
import { Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import type { BaseAuthFormProps } from "./types";

export interface ResendVerificationFormProps extends BaseAuthFormProps {
	/** Login route path (default: "/login") */
	loginRoute?: string | undefined;
	/** Verify email callback route path (default: "/verify-email") */
	verifyEmailRoute?: string | undefined;
}

export function ResendVerificationForm({
	authClient,
	navigate,
	icon,
	showBackgroundEffects = true,
	loginRoute = "/login",
	verifyEmailRoute = "/verify-email",
}: ResendVerificationFormProps) {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");
	const [cooldownSeconds, setCooldownSeconds] = useState(0);

	// Handle cooldown (30 seconds)
	useEffect(() => {
		if (cooldownSeconds > 0) {
			const timer = setTimeout(() => {
				setCooldownSeconds(cooldownSeconds - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [cooldownSeconds]);

	const handleResendError = (error: unknown, email: string): void => {
		const errorData = error as {
			error?: { message?: string; status?: number };
		};
		const errorMessage = errorData?.error?.message || "";
		const status = errorData?.error?.status;

		if (status === 429) {
			setCooldownSeconds(30);
			toast.error(
				"Too many requests. Please wait 30 seconds before trying again.",
			);
		} else if (
			errorMessage.includes("not found") ||
			errorMessage.includes("does not exist")
		) {
			// Email doesn't exist (best practice: don't reveal if email exists)
			// Show success message anyway to prevent email enumeration
			setSubmittedEmail(email);
			setIsSubmitted(true);
			setCooldownSeconds(30);
			toast.success("If this email exists, a verification link has been sent.");
		} else if (
			errorMessage.includes("already verified") ||
			errorMessage.includes("verified")
		) {
			toast.info("This email is already verified. You can sign in.");
			navigate({ to: loginRoute });
		} else {
			toast.error(
				errorMessage || "Failed to send verification email. Please try again.",
			);
		}
	};

	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			if (cooldownSeconds > 0) {
				toast.error(
					`Please wait ${cooldownSeconds} seconds before requesting another email.`,
				);
				return;
			}

			try {
				await authClient.sendVerificationEmail?.({
					email: value.email,
					callbackURL: verifyEmailRoute,
				});
				setSubmittedEmail(value.email);
				setIsSubmitted(true);
				setCooldownSeconds(30);
				toast.success("Verification email sent! Please check your inbox.");
			} catch (error: unknown) {
				handleResendError(error, value.email);
			}
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
			}),
		},
	});

	if (isSubmitted) {
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
							Verification link sent
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
							{submittedEmail && (
								<p className="font-medium text-foreground text-sm">
									{submittedEmail}
								</p>
							)}
							<p className="text-muted-foreground text-sm">
								Click the link in the email to verify your account. The link
								will expire in 1 hour.
							</p>
							<p className="text-muted-foreground text-xs">
								<strong>Tip:</strong> Don't see the email? Check your spam or
								junk folder.
							</p>
							<div className="space-y-2 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setIsSubmitted(false);
										form.reset();
									}}
									className="w-full"
								>
									Send another email
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
						{icon}
					</div>
					<h1 className="text-center font-bold text-3xl">
						Resend verification email
					</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						Enter your email address and we'll send you a new verification link.
					</p>
				</div>

				{/* Form card */}
				<div
					className={`rounded-xl border p-6 shadow-sm ${showBackgroundEffects ? "bg-card/80 shadow-black/5 shadow-xl backdrop-blur-sm" : "bg-card"}`}
				>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<div>
							<form.Field name="email">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											autoComplete="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-describedby={
												field.state.meta.errors.length > 0
													? `${field.name}-error`
													: undefined
											}
											aria-invalid={
												field.state.meta.errors.length > 0 ? true : undefined
											}
										/>
										{field.state.meta.errors.map((error) => (
											<FormMessage
												key={error?.message}
												id={`${field.name}-error`}
											>
												{error?.message}
											</FormMessage>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className={`w-full ${showBackgroundEffects ? "interactive-glow" : ""}`}
									disabled={
										!state.canSubmit ||
										state.isSubmitting ||
										cooldownSeconds > 0
									}
								>
									{state.isSubmitting
										? "Sending..."
										: cooldownSeconds > 0
											? `Wait ${cooldownSeconds}s before resending`
											: "Send verification link"}
								</Button>
							)}
						</form.Subscribe>
						{cooldownSeconds > 0 && (
							<p className="text-center text-muted-foreground text-xs">
								You can request another email in {cooldownSeconds} seconds.
							</p>
						)}
					</form>

					<div className="mt-4 text-center">
						<Button
							variant="link"
							onClick={() => {
								navigate({ to: loginRoute });
							}}
						>
							Back to Login
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
