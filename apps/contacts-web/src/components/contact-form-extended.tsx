/**
 * Extended contact form component for full-page create/edit
 * Based on EventFormExtended pattern from Calendar app
 * Supports multi-value fields (emails, phones, addresses, IM handles, relations)
 */

import { useFormTracking } from "@appstandard/react-utils";
import {
	Badge,
	Button,
	CollapsibleSection,
	Input,
	Label,
	MobileFormProgress,
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
	ContactIMData,
	ContactPhoneData,
	ContactRelationData,
} from "@appstandard-contacts/core";
import {
	Building,
	Calendar,
	Globe,
	Loader2,
	Mail,
	Tag,
	User,
	Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	AddressesSection,
	EmailsSection,
	ImHandlesSection,
	PhonesSection,
	RelationsSection,
} from "./contact-form";

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
	imHandles?: ContactIMData[] | undefined;
	relations?: ContactRelationData[] | undefined;
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
	const [imHandles, setImHandles] = useState<ContactIMData[]>(
		initialData?.imHandles || [],
	);
	const [relations, setRelations] = useState<ContactRelationData[]>(
		initialData?.relations || [],
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
					(initialData?.addresses && initialData.addresses.length > 0) ||
					(initialData?.imHandles && initialData.imHandles.length > 0),
			),
	);
	const [showRelationsSection, setShowRelationsSection] = useState(
		mode === "edit" ||
			Boolean(initialData?.relations && initialData.relations.length > 0),
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
			imHandles: imHandles.filter((im) => im.handle.trim()),
			relations: relations.filter((r) => r.relatedName.trim()),
		});
	};

	// Form tracking for dirty state and beforeunload warning
	const currentData = {
		formattedName,
		givenName,
		familyName,
		additionalName,
		namePrefix,
		nameSuffix,
		nickname,
		organization,
		title,
		role,
		birthday,
		anniversary,
		gender,
		kind,
		photoUrl,
		url,
		note,
		categories,
		emails,
		phones,
		addresses,
		imHandles,
		relations,
	};
	const { isDirty } = useFormTracking({
		initialData: (initialData || {}) as Record<string, unknown>,
		currentData: currentData as Record<string, unknown>,
		warnOnUnload: true,
	});

	// Section refs for IntersectionObserver (mobile progress)
	const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [currentSection, setCurrentSection] = useState(0);

	// IntersectionObserver for mobile section tracking
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = sectionRefs.current.indexOf(
							entry.target as HTMLDivElement,
						);
						if (index !== -1) {
							setCurrentSection(index);
						}
					}
				}
			},
			{ threshold: 0.5, rootMargin: "-20% 0px -60% 0px" },
		);

		for (const ref of sectionRefs.current) {
			if (ref) observer.observe(ref);
		}

		return () => observer.disconnect();
	}, []);

	// Count total sections for mobile progress indicator
	const totalSections = 6;
	const sectionNames = [
		"Basic Info",
		"Name Details",
		"Contact",
		"Relations",
		"Work",
		"Details",
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Mobile progress indicator */}
			<MobileFormProgress
				currentSection={currentSection}
				totalSections={totalSections}
				sectionName={sectionNames[currentSection]}
			/>

			{/* Basic Info Section */}
			<div
				ref={(el) => {
					sectionRefs.current[0] = el;
				}}
			>
				<CollapsibleSection
					id="basic-info"
					title="Basic Information"
					icon={User}
					isExpanded={true}
					onToggle={() => {}}
				>
					<div className="space-y-4">
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
									disabled={isSubmitting}
								/>
								{(givenName || familyName) && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={generateFormattedName}
										title="Generate from name parts"
										disabled={isSubmitting}
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
								disabled={isSubmitting}
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
					</div>
				</CollapsibleSection>
			</div>

			{/* Name Details Section */}
			<div
				ref={(el) => {
					sectionRefs.current[1] = el;
				}}
			>
				<CollapsibleSection
					id="name-details"
					title="Name Details"
					icon={User}
					isExpanded={showNameSection}
					onToggle={() => setShowNameSection(!showNameSection)}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="namePrefix">Prefix</Label>
								<Input
									id="namePrefix"
									value={namePrefix}
									onChange={(e) => setNamePrefix(e.target.value)}
									placeholder="Mr., Dr., etc."
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nameSuffix">Suffix</Label>
								<Input
									id="nameSuffix"
									value={nameSuffix}
									onChange={(e) => setNameSuffix(e.target.value)}
									placeholder="Jr., III, etc."
									disabled={isSubmitting}
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
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="familyName">Last Name</Label>
								<Input
									id="familyName"
									value={familyName}
									onChange={(e) => setFamilyName(e.target.value)}
									placeholder="Last name"
									disabled={isSubmitting}
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
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nickname">Nickname</Label>
								<Input
									id="nickname"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									placeholder="Nickname"
									disabled={isSubmitting}
								/>
							</div>
						</div>
					</div>
				</CollapsibleSection>
			</div>

			{/* Contact Information Section */}
			<div
				ref={(el) => {
					sectionRefs.current[2] = el;
				}}
			>
				<CollapsibleSection
					id="contact-info"
					title="Contact Information"
					icon={Mail}
					isExpanded={showContactSection}
					onToggle={() => setShowContactSection(!showContactSection)}
					badge={
						emails.length +
							phones.length +
							addresses.length +
							imHandles.length >
						0
							? emails.length +
								phones.length +
								addresses.length +
								imHandles.length
							: undefined
					}
				>
					<div className="space-y-8">
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

						{/* IM Handles */}
						<ImHandlesSection
							imHandles={imHandles}
							onChange={setImHandles}
							isSubmitting={isSubmitting}
						/>

						{/* Addresses */}
						<AddressesSection
							addresses={addresses}
							onChange={setAddresses}
							isSubmitting={isSubmitting}
						/>
					</div>
				</CollapsibleSection>
			</div>

			{/* Relations Section */}
			<div
				ref={(el) => {
					sectionRefs.current[3] = el;
				}}
			>
				<CollapsibleSection
					id="relations"
					title="Related People"
					icon={Users}
					isExpanded={showRelationsSection}
					onToggle={() => setShowRelationsSection(!showRelationsSection)}
					badge={relations.length > 0 ? relations.length : undefined}
				>
					<RelationsSection
						relations={relations}
						onChange={setRelations}
						isSubmitting={isSubmitting}
					/>
				</CollapsibleSection>
			</div>

			{/* Work Section */}
			<div
				ref={(el) => {
					sectionRefs.current[4] = el;
				}}
			>
				<CollapsibleSection
					id="work"
					title="Work"
					icon={Building}
					isExpanded={showWorkSection}
					onToggle={() => setShowWorkSection(!showWorkSection)}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="organization">Organization</Label>
							<Input
								id="organization"
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								placeholder="Company name"
								disabled={isSubmitting}
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
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<Input
									id="role"
									value={role}
									onChange={(e) => setRole(e.target.value)}
									placeholder="Function or occupation"
									disabled={isSubmitting}
								/>
							</div>
						</div>
					</div>
				</CollapsibleSection>
			</div>

			{/* Details Section */}
			<div
				ref={(el) => {
					sectionRefs.current[5] = el;
				}}
			>
				<CollapsibleSection
					id="details"
					title="Additional Details"
					icon={Tag}
					isExpanded={showDetailsSection}
					onToggle={() => setShowDetailsSection(!showDetailsSection)}
				>
					<div className="space-y-4">
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
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="anniversary">Anniversary</Label>
								<Input
									id="anniversary"
									type="date"
									value={anniversary}
									onChange={(e) => setAnniversary(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="gender">Gender</Label>
								<Select
									value={gender}
									onValueChange={setGender}
									disabled={isSubmitting}
								>
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
									disabled={isSubmitting}
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
								disabled={isSubmitting}
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
								disabled={isSubmitting}
							/>
							{categories && (
								<div className="flex flex-wrap gap-1 pt-1">
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
								disabled={isSubmitting}
							/>
						</div>
					</div>
				</CollapsibleSection>
			</div>

			{/* Desktop Actions */}
			<div className="hidden justify-end gap-3 sm:flex">
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

			{/* Mobile Sticky Actions */}
			<div className="fixed right-0 bottom-0 left-0 border-t bg-background p-4 sm:hidden">
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || !formattedName.trim()}
						className="flex-1"
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{mode === "create" ? "Create" : "Save"}
					</Button>
				</div>
				{isDirty && (
					<p className="mt-2 text-center text-muted-foreground text-xs">
						You have unsaved changes
					</p>
				)}
			</div>

			{/* Mobile bottom padding for sticky footer */}
			<div className="h-24 sm:hidden" />
		</form>
	);
}
