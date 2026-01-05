/**
 * Shared Change Password Form Component
 * For authenticated users to change their password
 */

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import type { BaseAuthFormProps } from "./types";

export interface ChangePasswordFormProps extends BaseAuthFormProps {
	/** Account route path (default: "/account") */
	accountRoute?: string | undefined;
}

export function ChangePasswordForm({
	authClient,
	navigate,
	showBackgroundEffects = true,
	accountRoute = "/account",
}: ChangePasswordFormProps) {
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (value.newPassword !== value.confirmPassword) {
				toast.error("New passwords do not match.");
				return;
			}

			try {
				await authClient.changePassword?.({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
					revokeOtherSessions: true,
				});

				toast.success("Password changed successfully!");
				// Redirect to account after 1 second
				setTimeout(() => {
					navigate({ to: accountRoute });
				}, 1000);
			} catch (error: unknown) {
				const errorData = error as {
					error?: { message?: string; status?: number };
				};
				const errorMessage = errorData?.error?.message || "";
				const status = errorData?.error?.status;

				if (status === 429) {
					toast.error(
						"Too many requests. Please wait a moment before trying again.",
					);
				} else if (
					errorMessage.includes("current password") ||
					errorMessage.includes("incorrect") ||
					status === 401
				) {
					toast.error("Current password is incorrect. Please try again.");
				} else {
					toast.error(
						errorMessage || "Failed to change password. Please try again.",
					);
				}
			}
		},
		validators: {
			onSubmit: z
				.object({
					currentPassword: z.string().min(1, "Current password is required"),
					newPassword: z
						.string()
						.min(8, "Password must contain at least 8 characters"),
					confirmPassword: z.string(),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					message: "Passwords do not match",
					path: ["confirmPassword"],
				}),
		},
	});

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
					<h1 className="text-center font-bold text-3xl">Change password</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						Update your account password
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
						{/* Current password */}
						<div>
							<form.Field name="currentPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Current password</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showCurrentPassword ? "text" : "password"}
												autoComplete="current-password"
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
													setShowCurrentPassword(!showCurrentPassword)
												}
												className="absolute top-1/2 right-3 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
												aria-label={
													showCurrentPassword
														? "Hide password"
														: "Show password"
												}
											>
												{showCurrentPassword ? (
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

						{/* New password */}
						<div>
							<form.Field name="newPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>New password</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showNewPassword ? "text" : "password"}
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
												onClick={() => setShowNewPassword(!showNewPassword)}
												className="absolute top-1/2 right-3 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
												aria-label={
													showNewPassword ? "Hide password" : "Show password"
												}
											>
												{showNewPassword ? (
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

						{/* Confirm password */}
						<div>
							<form.Field name="confirmPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Confirm new password</Label>
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
												className="absolute top-1/2 right-3 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
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
									{state.isSubmitting
										? "Changing password..."
										: "Change password"}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="mt-4 text-center">
						<Button
							variant="link"
							onClick={() => {
								navigate({ to: accountRoute });
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
