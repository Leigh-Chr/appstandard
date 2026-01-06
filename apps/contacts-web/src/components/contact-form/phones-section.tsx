/**
 * Phones section for contact form
 * Supports multiple phone numbers with type selection
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
import type { ContactPhoneData } from "@appstandard-contacts/core";
import { PHONE_TYPE_VALUES } from "@appstandard-contacts/core";
import { AlertCircle, Phone, Plus, X } from "lucide-react";

interface PhonesSectionProps {
	phones: ContactPhoneData[];
	onChange: (phones: ContactPhoneData[]) => void;
	validationErrors?: Record<number, string>;
	onValidationErrorChange?: (errors: Record<number, string>) => void;
	isSubmitting: boolean;
}

const PHONE_TYPE_LABELS: Record<string, string> = {
	home: "Home",
	work: "Work",
	cell: "Mobile",
	fax: "Fax",
	pager: "Pager",
	voice: "Voice",
	text: "Text",
	textphone: "Text Phone",
	video: "Video",
};

function validatePhone(number: string): string | undefined {
	if (!number) return "Phone number is required";
	// Basic phone validation - allow digits, spaces, +, -, (), .
	const phoneRegex = /^[\d\s+\-().]+$/;
	if (!phoneRegex.test(number)) return "Invalid phone format";
	if (number.replace(/\D/g, "").length < 5) return "Phone number too short";
	return undefined;
}

export function PhonesSection({
	phones,
	onChange,
	validationErrors = {},
	onValidationErrorChange,
	isSubmitting,
}: PhonesSectionProps) {
	const handleAddPhone = () => {
		onChange([
			...phones,
			{ number: "", type: "cell", isPrimary: phones.length === 0 },
		]);
	};

	const handleRemovePhone = (index: number) => {
		const newPhones = phones.filter((_, i) => i !== index);
		// If we removed the primary, make the first one primary
		const first = newPhones[0];
		if (phones[index]?.isPrimary && first) {
			newPhones[0] = {
				number: first.number,
				type: first.type,
				isPrimary: true,
			};
		}
		onChange(newPhones);
		// Clear validation error for this index
		if (validationErrors[index] && onValidationErrorChange) {
			const newErrors = { ...validationErrors };
			delete newErrors[index];
			onValidationErrorChange(newErrors);
		}
	};

	const handlePhoneChange = (index: number, value: string) => {
		const newPhones = [...phones];
		newPhones[index] = { ...newPhones[index], number: value };
		onChange(newPhones);
		// Real-time validation
		if (onValidationErrorChange) {
			const error = validatePhone(value);
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
		const newPhones = [...phones];
		const current = newPhones[index];
		if (current) {
			newPhones[index] = {
				number: current.number,
				type: type as ContactPhoneData["type"],
				isPrimary: current.isPrimary,
			};
			onChange(newPhones);
		}
	};

	const handlePrimaryChange = (index: number, isPrimary: boolean) => {
		const newPhones = phones.map((phone, i) => ({
			...phone,
			isPrimary: i === index ? isPrimary : false,
		}));
		onChange(newPhones);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="flex items-center gap-2 font-medium text-sm">
					<Phone className="h-4 w-4 text-muted-foreground" />
					Phone Numbers ({phones.length})
				</h4>
			</div>

			{phones.length === 0 && (
				<div className="flex items-start gap-3 rounded-md border border-muted bg-muted/50 p-4">
					<Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No phone numbers yet. Click "Add phone" below to add one.
					</p>
				</div>
			)}

			{phones.map((phone, index) => (
				<Card key={`phone-${index}`} className="border-muted p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<Phone className="h-4 w-4 text-muted-foreground" />
								Phone {index + 1}
								{phone.isPrimary && (
									<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
										Primary
									</span>
								)}
							</h4>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleRemovePhone(index)}
								disabled={isSubmitting}
								aria-label={`Remove phone ${index + 1}`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`phone-number-${index}`}>Number *</Label>
								<Input
									id={`phone-number-${index}`}
									type="tel"
									value={phone.number}
									onChange={(e) => handlePhoneChange(index, e.target.value)}
									disabled={isSubmitting}
									placeholder="+1 (555) 123-4567"
									className={
										validationErrors[index] ? "border-destructive" : ""
									}
									aria-invalid={validationErrors[index] ? "true" : "false"}
									aria-describedby={
										validationErrors[index] ? `phone-${index}-error` : undefined
									}
								/>
								{validationErrors[index] && (
									<p
										id={`phone-${index}-error`}
										className="flex items-center gap-1 text-destructive text-xs"
										role="alert"
									>
										<AlertCircle className="h-3 w-3" aria-hidden="true" />
										{validationErrors[index]}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor={`phone-type-${index}`}>Type</Label>
								<Select
									value={phone.type || "cell"}
									onValueChange={(value) => handleTypeChange(index, value)}
									disabled={isSubmitting}
								>
									<SelectTrigger id={`phone-type-${index}`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PHONE_TYPE_VALUES.map((type) => (
											<SelectItem key={type} value={type}>
												{PHONE_TYPE_LABELS[type] || type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{phones.length > 1 && (
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label
										htmlFor={`phone-primary-${index}`}
										className="cursor-pointer font-normal text-sm"
									>
										Set as primary phone
									</Label>
									<p className="text-muted-foreground text-xs">
										This phone will be displayed on contact cards.
									</p>
								</div>
								<Switch
									id={`phone-primary-${index}`}
									checked={phone.isPrimary || false}
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
				onClick={handleAddPhone}
				disabled={isSubmitting}
			>
				<Plus className="h-4 w-4" />
				Add phone
			</Button>
		</div>
	);
}
