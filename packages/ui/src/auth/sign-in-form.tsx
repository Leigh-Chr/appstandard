/**
 * Shared Sign-In Form Component
 * Uses AppConfig context for icon/appName/defaultRedirect when available
 */

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { useAppConfig } from "../app-context";
import { AppLogo } from "../app-logo";
import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import type { AuthClient, NavigateFunction } from "./types";

export type { AuthClient, NavigateFunction };

export interface SignInFormProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Navigation function from TanStack Router */
	navigate: NavigateFunction;
	/** App icon component (optional if AppProvider is used) */
	icon?: React.ReactNode | undefined;
	/** App name for display (optional if AppProvider is used) */
	appName?: string | undefined;
	/** Default redirect path after login (optional if AppProvider is used) */
	defaultRedirect?: string | undefined;
	/** Show forgot password link */
	showForgotPassword?: boolean | undefined;
	/** Show resend verification link */
	showResendVerification?: boolean | undefined;
	/** Show background effects (aurora, dot-grid) */
	showBackgroundEffects?: boolean | undefined;
	/** Callback to switch to sign-up form */
	onSwitchToSignUp: () => void;
	/** URL to redirect to after successful login (overrides defaultRedirect) */
	redirectTo?: string | undefined;
	/** Custom loader component */
	loader?: React.ReactNode | undefined;
}

export function SignInForm({
	authClient,
	navigate,
	icon: iconProp,
	appName: appNameProp,
	defaultRedirect: defaultRedirectProp,
	showForgotPassword = false,
	showResendVerification = false,
	showBackgroundEffects = false,
	onSwitchToSignUp,
	redirectTo,
	loader,
}: SignInFormProps) {
	const config = useAppConfig();
	const { isPending } = authClient.useSession();
	const [showPassword, setShowPassword] = useState(false);

	// Use props if provided, otherwise fall back to AppConfig
	const icon = iconProp ?? <AppLogo className="size-10" />;
	const appName = appNameProp ?? config.appSlug;
	const defaultRedirect = defaultRedirectProp ?? config.mainRoute;

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({ to: redirectTo || defaultRedirect });
						toast.success("Login successful");
					},
					onError: (error) => {
						const errorMessage =
							error.error.message || error.error.statusText || "";

						// Email not verified error
						if (
							errorMessage.includes("email") &&
							(errorMessage.includes("not verified") ||
								errorMessage.includes("unverified") ||
								errorMessage.includes("verify"))
						) {
							if (showResendVerification && authClient.sendVerificationEmail) {
								toast.error(
									"Please verify your email address before signing in.",
									{
										action: {
											label: "Resend email",
											onClick: async () => {
												try {
													if (redirectTo) {
														localStorage.setItem("signup_redirect", redirectTo);
													}
													await authClient.sendVerificationEmail?.({
														email: value.email,
														callbackURL: "/verify-email",
													});
													toast.success(
														"Verification email sent! Please check your inbox.",
													);
													navigate({
														to: "/check-email",
														search: {
															email: value.email,
															redirect: redirectTo,
														},
													});
												} catch {
													toast.error(
														"Failed to send verification email. Please try again.",
													);
												}
											},
										},
									},
								);
							} else {
								toast.error(
									"Please verify your email address before signing in.",
								);
							}
						}
						// Invalid credentials error
						else if (
							errorMessage.includes("invalid") ||
							errorMessage.includes("incorrect") ||
							error.error.status === 401
						) {
							toast.error(
								"Invalid email or password. Please check your credentials and try again.",
							);
						}
						// Rate limiting error
						else if (error.error.status === 429) {
							toast.error(
								"Too many login attempts. Please wait a moment and try again.",
							);
						}
						// Other errors
						else {
							toast.error(errorMessage || "Login failed. Please try again.");
						}
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z
					.string()
					.min(8, "Password must contain at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return (
			loader || (
				<div className="flex min-h-[400px] items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)
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
					<h1 className="text-center font-bold text-2xl">Welcome back!</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						Sign in to access your {appName}
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
											enterKeyHint="next"
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

						<div>
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Password</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showPassword ? "text" : "password"}
												autoComplete="current-password"
												enterKeyHint="done"
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
												className="absolute top-1/2 right-3 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
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

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className={`w-full ${showBackgroundEffects ? "interactive-glow" : ""}`}
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Signing in...
										</>
									) : (
										"Sign in"
									)}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="mt-4 space-y-2 text-center">
						{showForgotPassword && (
							<Button
								variant="link"
								onClick={() => navigate({ to: "/forgot-password" })}
								className="text-sm"
							>
								Forgot password?
							</Button>
						)}
						{showResendVerification && (
							<Button
								variant="link"
								onClick={() => navigate({ to: "/resend-verification" })}
								className="text-sm"
							>
								Didn't receive verification email?
							</Button>
						)}
						<div>
							<Button variant="link" onClick={onSwitchToSignUp}>
								Don't have an account? Sign up
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
