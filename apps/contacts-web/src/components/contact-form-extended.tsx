/**
 * Extended contact form component for full-page create/edit
 * Based on EventFormExtended pattern from Calendar app
 * Supports multi-value fields (emails, phones, addresses)
 */

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@appstandard/ui";
import type {
	ContactAddressData,
	ContactEmailData,
	ContactPhoneData,
} from "@appstandard-contacts/core";
import {
	Building,
	Calendar,
	ChevronDown,
	ChevronUp,
	Globe,
	Loader2,
	Mail,
	Tag,
	User,
} from "lucide-react";
import { useState } from "react";
import { AddressesSection, EmailsSection, PhonesSection } from "./contact-form";

export interface ContactFormData {
	formattedName: string;
	givenName?: string | undefined;
	familyName?: string | undefined;
	additionalName?: string | undefined;
	namePrefix?: string | undefined;
	nameSuffix?: string | undefined;
	nickname?: string | undefined;
	organization?: string | undefined;
	title?: string | undefined;
	role?: string | undefined;
	birthday?: Date | undefined;
	anniversary?: Date | undefined;
	gender?: "M" | "F" | "O" | "N" | "U" | undefined;
	kind?: "INDIVIDUAL" | "GROUP" | "ORG" | "LOCATION" | undefined;
	photoUrl?: string | undefined;
	url?: string | undefined;
	note?: string | undefined;
	categories?: string | undefined;
	// Multi-value fields
	emails?: ContactEmailData[] | undefined;
	phones?: ContactPhoneData[] | undefined;
	addresses?: ContactAddressData[] | undefined;
}

interface ContactFormExtendedProps {
	mode: "create" | "edit";
	initialData?: Partial<ContactFormData> | undefined;
	onSubmit: (data: ContactFormData) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	addressBookId: string;
}

const GENDER_OPTIONS = [
	{ value: "M", label: "Male" },
	{ value: "F", label: "Female" },
	{ value: "O", label: "Other" },
	{ value: "N", label: "Not applicable" },
	{ value: "U", label: "Unknown" },
] as const;

const KIND_OPTIONS = [
	{ value: "INDIVIDUAL", label: "Individual" },
	{ value: "GROUP", label: "Group" },
	{ value: "ORG", label: "Organization" },
	{ value: "LOCATION", label: "Location" },
] as const;

function formatDateForInput(date: Date | string | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().split("T")[0] || "";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form component with many sections is inherently complex
export function ContactFormExtended({
	mode,
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: ContactFormExtendedProps) {
	// Form state - Name
	const [formattedName, setFormattedName] = useState(
		initialData?.formattedName || "",
	);
	const [givenName, setGivenName] = useState(initialData?.givenName || "");
	const [familyName, setFamilyName] = useState(initialData?.familyName || "");
	const [additionalName, setAdditionalName] = useState(
		initialData?.additionalName || "",
	);
	const [namePrefix, setNamePrefix] = useState(initialData?.namePrefix || "");
	const [nameSuffix, setNameSuffix] = useState(initialData?.nameSuffix || "");
	const [nickname, setNickname] = useState(initialData?.nickname || "");

	// Form state - Organization
	const [organization, setOrganization] = useState(
		initialData?.organization || "",
	);
	const [title, setTitle] = useState(initialData?.title || "");
	const [role, setRole] = useState(initialData?.role || "");

	// Form state - Dates & Demographics
	const [birthday, setBirthday] = useState(
		formatDateForInput(initialData?.birthday),
	);
	const [anniversary, setAnniversary] = useState(
		formatDateForInput(initialData?.anniversary),
	);
	const [gender, setGender] = useState(initialData?.gender || "");
	const [kind, setKind] = useState<ContactFormData["kind"]>(
		initialData?.kind || "INDIVIDUAL",
	);

	// Form state - Other
	const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");
	const [url, setUrl] = useState(initialData?.url || "");
	const [note, setNote] = useState(initialData?.note || "");
	const [categories, setCategories] = useState(initialData?.categories || "");

	// Form state - Multi-value fields
	const [emails, setEmails] = useState<ContactEmailData[]>(
		initialData?.emails || [],
	);
	const [phones, setPhones] = useState<ContactPhoneData[]>(
		initialData?.phones || [],
	);
	const [addresses, setAddresses] = useState<ContactAddressData[]>(
		initialData?.addresses || [],
	);

	// Validation errors for multi-value fields
	const [emailErrors, setEmailErrors] = useState<Record<number, string>>({});
	const [phoneErrors, setPhoneErrors] = useState<Record<number, string>>({});

	// Section visibility state
	const [showNameSection, setShowNameSection] = useState(
		mode === "edit" ||
			Boolean(
				initialData?.givenName ||
					initialData?.familyName ||
					initialData?.nickname,
			),
	);
	const [showContactSection, setShowContactSection] = useState(
		mode === "edit" ||
			Boolean(
				(initialData?.emails && initialData.emails.length > 0) ||
					(initialData?.phones && initialData.phones.length > 0) ||
					(initialData?.addresses && initialData.addresses.length > 0),
			),
	);
	const [showWorkSection, setShowWorkSection] = useState(
		mode === "edit" ||
			Boolean(
				initialData?.organization || initialData?.title || initialData?.role,
			),
	);
	const [showDetailsSection, setShowDetailsSection] = useState(
		mode === "edit" ||
			Boolean(
				initialData?.birthday ||
					initialData?.anniversary ||
					initialData?.gender ||
					initialData?.url ||
					initialData?.note ||
					initialData?.categories,
			),
	);

	// Auto-generate formatted name from name parts
	const generateFormattedName = () => {
		const parts = [
			namePrefix,
			givenName,
			additionalName,
			familyName,
			nameSuffix,
		]
			.filter(Boolean)
			.join(" ")
			.trim();
		if (parts) {
			setFormattedName(parts);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Check for validation errors
		if (
			Object.keys(emailErrors).length > 0 ||
			Object.keys(phoneErrors).length > 0
		) {
			return;
		}

		onSubmit({
			formattedName,
			givenName: givenName || undefined,
			familyName: familyName || undefined,
			additionalName: additionalName || undefined,
			namePrefix: namePrefix || undefined,
			nameSuffix: nameSuffix || undefined,
			nickname: nickname || undefined,
			organization: organization || undefined,
			title: title || undefined,
			role: role || undefined,
			birthday: birthday ? new Date(birthday) : undefined,
			anniversary: anniversary ? new Date(anniversary) : undefined,
			gender: (gender as ContactFormData["gender"]) || undefined,
			kind: (kind as ContactFormData["kind"]) || undefined,
			photoUrl: photoUrl || undefined,
			url: url || undefined,
			note: note || undefined,
			categories: categories || undefined,
			// Multi-value fields - filter out empty entries
			emails: emails.filter((e) => e.email.trim()),
			phones: phones.filter((p) => p.number.trim()),
			addresses: addresses.filter(
				(a) => a.streetAddress || a.locality || a.country,
			),
		});
	};

	// Count total sections for mobile progress indicator
	const totalSections = 5;
	const expandedSections = [
		true, // Basic info is always visible
		showNameSection,
		showContactSection,
		showWorkSection,
		showDetailsSection,
	].filter(Boolean).length;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Mobile progress indicator */}
			<div className="flex items-center justify-between text-muted-foreground text-sm sm:hidden">
				<span>
					Section {expandedSections} of {totalSections}
				</span>
				<span>
					{Math.round((expandedSections / totalSections) * 100)}% complete
				</span>
			</div>

			{/* Basic Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<User className="h-5 w-5" />
						Basic Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="formattedName">Display Name *</Label>
						<div className="flex gap-2">
							<Input
								id="formattedName"
								value={formattedName}
								onChange={(e) => setFormattedName(e.target.value)}
								placeholder="Full name"
								className="flex-1"
								required
							/>
							{(givenName || familyName) && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={generateFormattedName}
									title="Generate from name parts"
								>
									Auto
								</Button>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="kind">Contact Type</Label>
						<Select
							value={kind}
							onValueChange={(v) => setKind(v as ContactFormData["kind"])}
						>
							<SelectTrigger id="kind">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{KIND_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Name Details Section - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowNameSection(!showNameSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Name Details
						</span>
						{showNameSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showNameSection && (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="namePrefix">Prefix</Label>
								<Input
									id="namePrefix"
									value={namePrefix}
									onChange={(e) => setNamePrefix(e.target.value)}
									placeholder="Mr., Dr., etc."
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nameSuffix">Suffix</Label>
								<Input
									id="nameSuffix"
									value={nameSuffix}
									onChange={(e) => setNameSuffix(e.target.value)}
									placeholder="Jr., III, etc."
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="givenName">First Name</Label>
								<Input
									id="givenName"
									value={givenName}
									onChange={(e) => setGivenName(e.target.value)}
									placeholder="First name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="familyName">Last Name</Label>
								<Input
									id="familyName"
									value={familyName}
									onChange={(e) => setFamilyName(e.target.value)}
									placeholder="Last name"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="additionalName">Middle Name</Label>
								<Input
									id="additionalName"
									value={additionalName}
									onChange={(e) => setAdditionalName(e.target.value)}
									placeholder="Middle name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nickname">Nickname</Label>
								<Input
									id="nickname"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									placeholder="Nickname"
								/>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Contact Information Section - Collapsible (NEW!) */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowContactSection(!showContactSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<Mail className="h-5 w-5" />
							Contact Information
							{(emails.length > 0 ||
								phones.length > 0 ||
								addresses.length > 0) && (
								<Badge variant="secondary" className="ml-2">
									{emails.length + phones.length + addresses.length}
								</Badge>
							)}
						</span>
						{showContactSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showContactSection && (
					<CardContent className="space-y-8">
						{/* Emails */}
						<EmailsSection
							emails={emails}
							onChange={setEmails}
							validationErrors={emailErrors}
							onValidationErrorChange={setEmailErrors}
							isSubmitting={isSubmitting}
						/>

						{/* Phones */}
						<PhonesSection
							phones={phones}
							onChange={setPhones}
							validationErrors={phoneErrors}
							onValidationErrorChange={setPhoneErrors}
							isSubmitting={isSubmitting}
						/>

						{/* Addresses */}
						<AddressesSection
							addresses={addresses}
							onChange={setAddresses}
							isSubmitting={isSubmitting}
						/>
					</CardContent>
				)}
			</Card>

			{/* Work Section - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowWorkSection(!showWorkSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<Building className="h-5 w-5" />
							Work
						</span>
						{showWorkSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showWorkSection && (
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="organization">Organization</Label>
							<Input
								id="organization"
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								placeholder="Company name"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="title">Job Title</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Job title"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<Input
									id="role"
									value={role}
									onChange={(e) => setRole(e.target.value)}
									placeholder="Function or occupation"
								/>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Details Section - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowDetailsSection(!showDetailsSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<Tag className="h-5 w-5" />
							Additional Details
						</span>
						{showDetailsSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showDetailsSection && (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="birthday" className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Birthday
								</Label>
								<Input
									id="birthday"
									type="date"
									value={birthday}
									onChange={(e) => setBirthday(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="anniversary">Anniversary</Label>
								<Input
									id="anniversary"
									type="date"
									value={anniversary}
									onChange={(e) => setAnniversary(e.target.value)}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="gender">Gender</Label>
								<Select value={gender} onValueChange={setGender}>
									<SelectTrigger id="gender">
										<SelectValue placeholder="Select..." />
									</SelectTrigger>
									<SelectContent>
										{GENDER_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="photoUrl">Photo URL</Label>
								<Input
									id="photoUrl"
									type="url"
									value={photoUrl}
									onChange={(e) => setPhotoUrl(e.target.value)}
									placeholder="https://..."
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="url" className="flex items-center gap-2">
								<Globe className="h-4 w-4" />
								Website
							</Label>
							<Input
								id="url"
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="categories" className="flex items-center gap-2">
								<Tag className="h-4 w-4" />
								Categories
							</Label>
							<Input
								id="categories"
								value={categories}
								onChange={(e) => setCategories(e.target.value)}
								placeholder="family, work, friend (comma-separated)"
							/>
							{categories && (
								<div className="flex flex-wrap gap-1">
									{categories.split(",").map((cat) => (
										<Badge key={cat.trim()} variant="secondary">
											{cat.trim()}
										</Badge>
									))}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="note">Notes</Label>
							<Textarea
								id="note"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder="Additional notes..."
								rows={3}
							/>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || !formattedName.trim()}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{mode === "create" ? "Create Contact" : "Save Changes"}
				</Button>
			</div>
		</form>
	);
}
