/**
 * Shared Delete Account Form Component
 * For account deletion with confirmation
 */

import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "../alert";
import type { AuthClient, NavigateFunction } from "../auth/types";
import { Button } from "../button";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";

export interface DeleteAccountFormProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Navigation function from TanStack Router */
	navigate: NavigateFunction;
	/** Account route path (default: "/account") */
	accountRoute?: string | undefined;
	/** Home route path (default: "/") */
	homeRoute?: string | undefined;
	/** Show background effects (aurora, dot-grid) */
	showBackgroundEffects?: boolean | undefined;
	/** Custom warning items to display */
	warningItems?: string[] | undefined;
}

const defaultWarningItems = [
	"Your account and profile information",
	"All your data and content",
	"All your settings and preferences",
];

export function DeleteAccountForm({
	authClient,
	navigate,
	accountRoute = "/account",
	homeRoute = "/",
	showBackgroundEffects = true,
	warningItems = defaultWarningItems,
}: DeleteAccountFormProps) {
	const [confirmationText, setConfirmationText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteMethod, setDeleteMethod] = useState<"email" | "password">(
		"email",
	);

	const handleDeleteAccountError = (error: unknown): void => {
		const errorData = error as {
			error?: { message?: string; status?: number };
		};
		const errorMessage = errorData?.error?.message || "";
		const status = errorData?.error?.status;

		if (status === 429) {
			toast.error(
				"Too many requests. Please wait a moment before trying again.",
			);
		} else if (errorMessage.includes("password") || status === 401) {
			toast.error("Invalid password. Please try again.");
		} else {
			toast.error(
				errorMessage || "Failed to delete account. Please try again.",
			);
		}
	};

	const performAccountDeletion = async (password?: string): Promise<void> => {
		if (deleteMethod === "password" && password) {
			await authClient.deleteUser?.({ password });
		} else {
			await authClient.deleteUser?.();
		}
	};

	const handleDeletionSuccess = (): void => {
		if (deleteMethod === "email") {
			toast.success(
				"Confirmation email sent! Please check your inbox and click the link to confirm account deletion.",
			);
			navigate({ to: accountRoute });
		} else {
			toast.success("Your account has been deleted successfully.");
			setTimeout(() => {
				navigate({ to: homeRoute });
			}, 2000);
		}
	};

	const form = useForm({
		defaultValues: {
			password: "",
		},
		onSubmit: async ({ value }) => {
			if (confirmationText !== "DELETE") {
				toast.error(
					'Please type "DELETE" in the confirmation field to proceed.',
				);
				return;
			}

			setIsDeleting(true);
			try {
				await performAccountDeletion(value.password);
				handleDeletionSuccess();
			} catch (error: unknown) {
				handleDeleteAccountError(error);
			} finally {
				setIsDeleting(false);
			}
		},
		validators: {
			onChange: ({ value }) => {
				if (deleteMethod === "password" && value.password) {
					if (value.password.length < 8) {
						return "Password must contain at least 8 characters";
					}
				}
				return undefined;
			},
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
					<div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 shadow-destructive/20 shadow-lg">
						<Trash2 className="size-7 text-destructive" />
					</div>
					<h1 className="text-center font-bold text-3xl">Delete account</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						This action is permanent and cannot be undone
					</p>
				</div>

				{/* Warning Alert */}
				<Alert variant="destructive" className="mb-6">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Warning: Irreversible action</AlertTitle>
					<AlertDescription>
						Deleting your account will permanently remove:
						<ul className="mt-2 list-inside list-disc space-y-1 text-sm">
							{warningItems.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>

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
						{/* Method selection */}
						<div>
							<Label>Confirmation method</Label>
							<div className="mt-2 space-y-2">
								<Button
									type="button"
									variant={deleteMethod === "email" ? "default" : "outline"}
									onClick={() => setDeleteMethod("email")}
									className="w-full"
								>
									Send confirmation email
								</Button>
								<Button
									type="button"
									variant={deleteMethod === "password" ? "default" : "outline"}
									onClick={() => setDeleteMethod("password")}
									className="w-full"
								>
									Confirm with password
								</Button>
							</div>
						</div>

						{/* Password field (only if password method selected) */}
						{deleteMethod === "password" && (
							<div>
								<form.Field name="password">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Current password</Label>
											<Input
												id={field.name}
												name={field.name}
												type="password"
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
											{field.state.meta.errors.length > 0 && (
												<FormMessage id={`${field.name}-error`}>
													{typeof field.state.meta.errors[0] === "string"
														? field.state.meta.errors[0]
														: "Invalid password"}
												</FormMessage>
											)}
										</div>
									)}
								</form.Field>
							</div>
						)}

						{/* Confirmation text */}
						<div>
							<Label htmlFor="confirmation">
								Type <strong>DELETE</strong> to confirm
							</Label>
							<Input
								id="confirmation"
								type="text"
								value={confirmationText}
								onChange={(e) => setConfirmationText(e.target.value)}
								placeholder="DELETE"
								className="mt-2"
							/>
						</div>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									variant="destructive"
									className="w-full"
									disabled={
										!state.canSubmit ||
										state.isSubmitting ||
										isDeleting ||
										confirmationText !== "DELETE" ||
										(deleteMethod === "password" && !form.state.values.password)
									}
								>
									{isDeleting || state.isSubmitting
										? "Deleting..."
										: "Delete my account"}
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
