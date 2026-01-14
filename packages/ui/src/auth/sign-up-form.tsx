/**
 * Shared Sign-Up Form Component
 * Uses AppConfig context for icon/tagline when available
 */

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
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

export interface SignUpFormProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Navigation function from TanStack Router */
	navigate: NavigateFunction;
	/** App icon component (optional if AppProvider is used) */
	icon?: React.ReactNode | undefined;
	/** Tagline for the app (optional, defaults to app description) */
	tagline?: string | undefined;
	/** Show background effects (aurora, dot-grid) */
	showBackgroundEffects?: boolean | undefined;
	/** Callback to switch to sign-in form */
	onSwitchToSignIn: () => void;
	/** URL to redirect to after successful registration */
	redirectTo?: string | undefined;
	/** Custom loader component */
	loader?: React.ReactNode | undefined;
}

export function SignUpForm({
	authClient,
	navigate,
	icon: iconProp,
	tagline: taglineProp,
	showBackgroundEffects = false,
	onSwitchToSignIn,
	redirectTo,
	loader,
}: SignUpFormProps) {
	const config = useAppConfig();
	const { isPending } = authClient.useSession();
	const [showPassword, setShowPassword] = useState(false);

	// Use props if provided, otherwise fall back to AppConfig
	const icon = iconProp ?? <AppLogo className="size-10" />;
	const tagline = taglineProp ?? config.description;

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						// Redirect to check-email page with email and redirect params
						navigate({
							to: "/check-email",
							search: {
								email: value.email,
								redirect: redirectTo,
							},
						});
						// Store redirect in localStorage for post-verification
						if (redirectTo) {
							localStorage.setItem("signup_redirect", redirectTo);
						}
						toast.success(
							"Registration successful! Please check your email to verify your account.",
						);
					},
					onError: (error) => {
						const errorMessage =
							error.error.message || error.error.statusText || "";

						// Temporary/disposable email blocked
						if (
							errorMessage.includes("temporary") ||
							errorMessage.includes("disposable") ||
							errorMessage.includes("not allowed")
						) {
							toast.error(
								"Temporary email addresses are not allowed. Please use a permanent email address.",
							);
						}
						// Rate limiting error
						else if (error.error.status === 429) {
							toast.error("Too many signup attempts. Please try again later.");
						}
						// Email already exists - show success to prevent account enumeration
						else if (
							errorMessage.includes("already") ||
							errorMessage.includes("exists") ||
							errorMessage.includes("duplicate")
						) {
							// Redirect to check-email as if registration succeeded
							// This prevents attackers from knowing if an account exists
							navigate({
								to: "/check-email",
								search: {
									email: value.email,
									redirect: redirectTo,
								},
							});
							toast.success(
								"If this email is not already registered, a verification link has been sent.",
							);
						}
						// Other errors
						else {
							toast.error(
								errorMessage || "Registration failed. Please try again.",
							);
						}
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must contain at least 2 characters"),
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
					<h1 className="text-center font-bold text-2xl">Create an account</h1>
					<p className="mt-2 flex items-center gap-2 text-center text-muted-foreground text-sm">
						<Sparkles className="size-4 text-primary" />
						{tagline}
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
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Name</Label>
										<Input
											id={field.name}
											name={field.name}
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
												autoComplete="new-password"
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

						{/* Info message about email verification */}
						<div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-muted-foreground text-sm">
							<p>
								After signing up, you'll receive a verification email. Please
								check your inbox to activate your account.
							</p>
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
											Registering...
										</>
									) : (
										"Sign up"
									)}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="mt-4 text-center">
						<Button variant="link" onClick={onSwitchToSignIn}>
							Already have an account? Sign in
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
