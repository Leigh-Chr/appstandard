/**
 * Shared Reset Password Form Component
 * For resetting password with a token from email
 */

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { SuccessAnimation } from "../animations/success-animation";
import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import type { BaseAuthFormProps } from "./types";

export interface ResetPasswordFormProps extends BaseAuthFormProps {
	/** Token from the reset password email */
	token: string;
	/** Error from the URL (e.g., "INVALID_TOKEN") */
	error?: string | undefined;
	/** Login route path (default: "/login") */
	loginRoute?: string | undefined;
	/** Forgot password route path (default: "/forgot-password") */
	forgotPasswordRoute?: string | undefined;
}

export function ResetPasswordForm({
	authClient,
	navigate,
	showBackgroundEffects = true,
	token,
	error,
	loginRoute = "/login",
	forgotPasswordRoute = "/forgot-password",
}: ResetPasswordFormProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		if (error) {
			if (error === "INVALID_TOKEN") {
				toast.error(
					"The password reset link is invalid or has expired. Please request a new one.",
				);
			} else {
				toast.error("An error occurred. Please try again.");
			}
		}
	}, [error]);

	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (!token) {
				toast.error(
					"Invalid reset token. Please request a new password reset link.",
				);
				return;
			}

			try {
				await authClient.resetPassword?.({
					newPassword: value.password,
					token,
				});
				setIsSuccess(true);
				toast.success("Password reset successfully!");
				// Redirect to login after 2 seconds
				setTimeout(() => {
					navigate({ to: loginRoute });
				}, 2000);
			} catch (error: unknown) {
				const errorMessage =
					(error as { error?: { message?: string } })?.error?.message ||
					"Failed to reset password. Please try again.";
				toast.error(errorMessage);
			}
		},
		validators: {
			onSubmit: z
				.object({
					password: z
						.string()
						.min(8, "Password must contain at least 8 characters"),
					confirmPassword: z.string(),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: "Passwords do not match",
					path: ["confirmPassword"],
				}),
		},
	});

	if (isSuccess) {
		return (
			<>
				<SuccessAnimation
					show={isSuccess}
					type="success"
					message="Password reset successfully!"
					onComplete={() => {
						setIsSuccess(false);
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
								<KeyRound className="h-16 w-16 text-green-500" />
							</div>
							<h1 className="font-bold text-2xl">Password Reset!</h1>
							<p className="mt-2 text-muted-foreground">
								Your password has been successfully reset. Redirecting to
								login...
							</p>
						</div>
					</div>
				</div>
			</>
		);
	}

	if (!token && !error) {
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
						<h1 className="font-bold text-2xl">Invalid Reset Link</h1>
						<p className="mt-2 text-muted-foreground">
							The password reset link is missing or invalid. Please request a
							new one.
						</p>
						<div className="mt-6 space-y-2">
							<Button
								onClick={() => {
									navigate({ to: forgotPasswordRoute });
								}}
								className="w-full"
							>
								Request New Reset Link
							</Button>
							<Button
								variant="outline"
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
						<KeyRound className="size-7 text-primary" />
					</div>
					<h1 className="text-center font-bold text-3xl">Reset password</h1>
					<p className="mt-2 flex items-center gap-2 text-center text-muted-foreground text-sm">
						<Sparkles className="size-4 text-primary" />
						Enter your new password
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
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>New Password</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showPassword ? "text" : "password"}
												autoComplete="new-password"
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
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
												aria-label={
													showPassword ? "Hide password" : "Show password"
												}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</button>
										</div>
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

						<div>
							<form.Field name="confirmPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Confirm Password</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showConfirmPassword ? "text" : "password"}
												autoComplete="new-password"
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
											<button
												type="button"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
												className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
												aria-label={
													showConfirmPassword
														? "Hide password"
														: "Show password"
												}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</button>
										</div>
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
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? "Resetting..." : "Reset password"}
								</Button>
							)}
						</form.Subscribe>
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
