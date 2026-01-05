/**
 * Shared Edit Profile Form Component
 * For editing user profile information
 */

import { useForm } from "@tanstack/react-form";
import { User } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import type { AuthClient, NavigateFunction } from "../auth/types";
import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";
import { Loader } from "../loader";

export interface EditProfileFormProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Navigation function from TanStack Router */
	navigate: NavigateFunction;
	/** Account route path (default: "/account") */
	accountRoute?: string | undefined;
	/** Show background effects (aurora, dot-grid) */
	showBackgroundEffects?: boolean | undefined;
}

export function EditProfileForm({
	authClient,
	navigate,
	accountRoute = "/account",
	showBackgroundEffects = true,
}: EditProfileFormProps) {
	const { data: session, isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			name: session?.user?.name || "",
		},
		onSubmit: async ({ value }) => {
			try {
				await authClient.updateUser?.({
					name: value.name,
				});

				toast.success("Profile updated successfully!");
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
				} else {
					toast.error(
						errorMessage || "Failed to update profile. Please try again.",
					);
				}
			}
		},
		validators: {
			onSubmit: z.object({
				name: z
					.string()
					.min(2, "Name must contain at least 2 characters")
					.max(200, "Name must not exceed 200 characters"),
			}),
		},
	});

	// Update form default values when session loads
	useEffect(() => {
		const sessionName = session?.user?.name;
		if (sessionName && form.state.values.name !== sessionName) {
			form.setFieldValue("name", sessionName);
		}
	}, [session?.user?.name, form]);

	if (isPending) {
		return <Loader />;
	}

	if (!session) {
		return null; // beforeLoad should prevent this, but TypeScript safety
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
						<User className="size-7 text-primary" />
					</div>
					<h1 className="text-center font-bold text-3xl">Edit profile</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						Update your account information
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
						{/* Name field */}
						<div>
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Name</Label>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											autoComplete="name"
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

						{/* Email field (read-only) */}
						<div>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={session?.user?.email || ""}
								disabled
								className="mt-2 bg-muted"
							/>
							<p className="mt-1 text-muted-foreground text-xs">
								Email cannot be changed.
							</p>
						</div>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className={`w-full ${showBackgroundEffects ? "interactive-glow" : ""}`}
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? "Updating..." : "Update profile"}
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
