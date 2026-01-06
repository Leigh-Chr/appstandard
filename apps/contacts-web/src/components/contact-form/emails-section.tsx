/**
 * Emails section for contact form
 * Supports multiple emails with type selection (home, work)
 */

import {
	Button,
	Card,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@appstandard/ui";
import type { ContactEmailData } from "@appstandard-contacts/core";
import { EMAIL_TYPE_VALUES } from "@appstandard-contacts/core";
import { AlertCircle, Mail, Plus, X } from "lucide-react";

interface EmailsSectionProps {
	emails: ContactEmailData[];
	onChange: (emails: ContactEmailData[]) => void;
	validationErrors?: Record<number, string>;
	onValidationErrorChange?: (errors: Record<number, string>) => void;
	isSubmitting: boolean;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
	home: "Home",
	work: "Work",
};

function validateEmail(email: string): string | undefined {
	if (!email) return "Email is required";
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) return "Invalid email format";
	return undefined;
}

export function EmailsSection({
	emails,
	onChange,
	validationErrors = {},
	onValidationErrorChange,
	isSubmitting,
}: EmailsSectionProps) {
	const handleAddEmail = () => {
		onChange([
			...emails,
			{ email: "", type: "home", isPrimary: emails.length === 0 },
		]);
	};

	const handleRemoveEmail = (index: number) => {
		const newEmails = emails.filter((_, i) => i !== index);
		// If we removed the primary, make the first one primary
		const first = newEmails[0];
		if (emails[index]?.isPrimary && first) {
			newEmails[0] = { email: first.email, type: first.type, isPrimary: true };
		}
		onChange(newEmails);
		// Clear validation error for this index
		if (validationErrors[index] && onValidationErrorChange) {
			const newErrors = { ...validationErrors };
			delete newErrors[index];
			onValidationErrorChange(newErrors);
		}
	};

	const handleEmailChange = (index: number, value: string) => {
		const newEmails = [...emails];
		newEmails[index] = { ...newEmails[index], email: value };
		onChange(newEmails);
		// Real-time validation
		if (onValidationErrorChange) {
			const error = validateEmail(value);
			if (error) {
				onValidationErrorChange({ ...validationErrors, [index]: error });
			} else {
				const newErrors = { ...validationErrors };
				delete newErrors[index];
				onValidationErrorChange(newErrors);
			}
		}
	};

	const handleTypeChange = (index: number, type: string) => {
		const newEmails = [...emails];
		const current = newEmails[index];
		if (current) {
			newEmails[index] = {
				email: current.email,
				type: type as ContactEmailData["type"],
				isPrimary: current.isPrimary,
			};
			onChange(newEmails);
		}
	};

	const handlePrimaryChange = (index: number, isPrimary: boolean) => {
		const newEmails = emails.map((email, i) => ({
			...email,
			isPrimary: i === index ? isPrimary : false,
		}));
		onChange(newEmails);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="flex items-center gap-2 font-medium text-sm">
					<Mail className="h-4 w-4 text-muted-foreground" />
					Email Addresses ({emails.length})
				</h4>
			</div>

			{emails.length === 0 && (
				<div className="flex items-start gap-3 rounded-md border border-muted bg-muted/50 p-4">
					<Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No email addresses yet. Click "Add email" below to add one.
					</p>
				</div>
			)}

			{emails.map((email, index) => (
				<Card key={`email-${index}`} className="border-muted p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<Mail className="h-4 w-4 text-muted-foreground" />
								Email {index + 1}
								{email.isPrimary && (
									<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
										Primary
									</span>
								)}
							</h4>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleRemoveEmail(index)}
								disabled={isSubmitting}
								aria-label={`Remove email ${index + 1}`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`email-address-${index}`}>Email *</Label>
								<Input
									id={`email-address-${index}`}
									type="email"
									value={email.email}
									onChange={(e) => handleEmailChange(index, e.target.value)}
									disabled={isSubmitting}
									placeholder="example@domain.com"
									className={
										validationErrors[index] ? "border-destructive" : ""
									}
									aria-invalid={validationErrors[index] ? "true" : "false"}
									aria-describedby={
										validationErrors[index] ? `email-${index}-error` : undefined
									}
								/>
								{validationErrors[index] && (
									<p
										id={`email-${index}-error`}
										className="flex items-center gap-1 text-destructive text-xs"
										role="alert"
									>
										<AlertCircle className="h-3 w-3" aria-hidden="true" />
										{validationErrors[index]}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor={`email-type-${index}`}>Type</Label>
								<Select
									value={email.type || "home"}
									onValueChange={(value) => handleTypeChange(index, value)}
									disabled={isSubmitting}
								>
									<SelectTrigger id={`email-type-${index}`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{EMAIL_TYPE_VALUES.map((type) => (
											<SelectItem key={type} value={type}>
												{EMAIL_TYPE_LABELS[type] || type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{emails.length > 1 && (
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label
										htmlFor={`email-primary-${index}`}
										className="cursor-pointer font-normal text-sm"
									>
										Set as primary email
									</Label>
									<p className="text-muted-foreground text-xs">
										This email will be displayed on contact cards.
									</p>
								</div>
								<Switch
									id={`email-primary-${index}`}
									checked={email.isPrimary || false}
									onCheckedChange={(checked) =>
										handlePrimaryChange(index, checked)
									}
									disabled={isSubmitting}
								/>
							</div>
						)}
					</div>
				</Card>
			))}

			<Button
				type="button"
				variant="outline"
				onClick={handleAddEmail}
				disabled={isSubmitting}
			>
				<Plus className="h-4 w-4" />
				Add email
			</Button>
		</div>
	);
}
