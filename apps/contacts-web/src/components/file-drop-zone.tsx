/**
 * FileDropZone - vCard file drag & drop zone with preview
 * Uses the generic FileDropZone from @appstandard/ui with vCard-specific configuration
 */

import {
	FileDropZone as BaseFileDropZone,
	Button,
	type FileValidationResult,
} from "@appstandard/ui";
import { Building2, CheckCircle2, Mail, Phone, User, X } from "lucide-react";
import { useState } from "react";

interface ParsedContact {
	name: string;
	email?: string | undefined;
	phone?: string | undefined;
	organization?: string | undefined;
}

interface FileDropZoneProps {
	accept?: string | undefined;
	maxSizeMB?: number | undefined;
	onFileSelect: (file: File) => void;
	onFileContent?: ((content: string) => void) | undefined;
	onPreviewParsed?: ((contacts: ParsedContact[]) => void) | undefined;
	disabled?: boolean | undefined;
	className?: string | undefined;
}

// Decode quoted-printable encoding (common in vCard)
function decodeQuotedPrintable(str: string): string {
	try {
		return str.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
			String.fromCharCode(Number.parseInt(hex, 16)),
		);
	} catch {
		return str;
	}
}

// Extract value from a vCard line (after the colon)
function extractLineValue(line: string): string {
	return line.includes(":") ? line.substring(line.indexOf(":") + 1) : "";
}

// Parse FN (Formatted Name) field
function parseFN(line: string): string | null {
	const value = extractLineValue(line);
	return value ? decodeQuotedPrintable(value) : null;
}

// Parse N (Name components) field
function parseN(line: string): string | null {
	const value = extractLineValue(line);
	const parts = value.split(";");
	// N format: LastName;FirstName;MiddleName;Prefix;Suffix
	const lastName = parts[0] || "";
	const firstName = parts[1] || "";
	const fullName = `${firstName} ${lastName}`.trim();
	return fullName ? decodeQuotedPrintable(fullName) : null;
}

// Parse simple value field (EMAIL, TEL)
function parseSimpleValue(line: string): string | null {
	const value = extractLineValue(line);
	return value ? decodeQuotedPrintable(value) : null;
}

// Parse ORG field (takes first part before semicolon)
function parseOrg(line: string): string | null {
	const value = extractLineValue(line);
	if (!value) return null;
	const firstPart = value.split(";")[0] || "";
	return firstPart ? decodeQuotedPrintable(firstPart) : null;
}

// Check if line matches a vCard property
function matchesProperty(line: string, prop: string): boolean {
	return line.startsWith(`${prop}:`) || line.startsWith(`${prop};`);
}

// Parse a single vCard block
function parseVcardBlock(lines: string[]): ParsedContact | null {
	const contact: Partial<ParsedContact> = {};

	for (const line of lines) {
		const trimmed = line.trim();

		if (!contact.name && matchesProperty(trimmed, "FN")) {
			contact.name = parseFN(trimmed) ?? undefined;
		} else if (!contact.name && matchesProperty(trimmed, "N")) {
			contact.name = parseN(trimmed) ?? undefined;
		} else if (!contact.email && trimmed.startsWith("EMAIL")) {
			contact.email = parseSimpleValue(trimmed) ?? undefined;
		} else if (!contact.phone && trimmed.startsWith("TEL")) {
			contact.phone = parseSimpleValue(trimmed) ?? undefined;
		} else if (!contact.organization && trimmed.startsWith("ORG")) {
			contact.organization = parseOrg(trimmed) ?? undefined;
		}
	}

	if (!contact.name) {
		return null;
	}

	return {
		name: contact.name,
		email: contact.email,
		phone: contact.phone,
		organization: contact.organization,
	};
}

// Parse vCard content for preview
function parseVcardContent(content: string): ParsedContact[] {
	const contacts: ParsedContact[] = [];

	// Handle line folding (lines starting with space/tab are continuations)
	const unfoldedContent = content.replace(/\r?\n[ \t]/g, "");
	const lines = unfoldedContent.split(/\r?\n/);

	let currentLines: string[] = [];
	let inVcard = false;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === "BEGIN:VCARD") {
			inVcard = true;
			currentLines = [];
		} else if (trimmed === "END:VCARD" && inVcard) {
			const contact = parseVcardBlock(currentLines);
			if (contact) {
				contacts.push(contact);
			}
			inVcard = false;
			currentLines = [];
		} else if (inVcard) {
			currentLines.push(trimmed);
		}
	}

	// Sort by name
	return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

function validateVcardFile(file: File): FileValidationResult {
	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension !== "vcf" && extension !== "vcard") {
		return { valid: false, error: "File must be in .vcf or .vcard format" };
	}
	return { valid: true };
}

function ContactPreviewItem({ contact }: { contact: ParsedContact }) {
	return (
		<div className="flex items-start gap-3 px-4 py-3">
			<User className="h-4 w-4 shrink-0 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{contact.name}</p>
				<div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
					{contact.email && (
						<span className="flex items-center gap-1 truncate">
							<Mail className="h-3 w-3" />
							{contact.email}
						</span>
					)}
					{contact.phone && (
						<span className="flex items-center gap-1">
							<Phone className="h-3 w-3" />
							{contact.phone}
						</span>
					)}
				</div>
				{contact.organization && (
					<p className="mt-0.5 flex items-center gap-1 truncate text-muted-foreground text-xs">
						<Building2 className="h-3 w-3" />
						{contact.organization}
					</p>
				)}
			</div>
		</div>
	);
}

function ContactsPreview({ contacts }: { contacts: ParsedContact[] }) {
	if (contacts.length === 0) return null;

	const withEmail = contacts.filter((c) => c.email).length;
	const withPhone = contacts.filter((c) => c.phone).length;

	return (
		<div className="rounded-lg border bg-card">
			<div className="border-b px-4 py-3">
				<h3 className="font-medium">Contact preview</h3>
				<p className="text-muted-foreground text-sm">
					{withEmail} with email, {withPhone} with phone
				</p>
			</div>
			<div className="max-h-64 divide-y overflow-y-auto">
				{contacts.slice(0, 10).map((contact, index) => (
					<ContactPreviewItem
						key={`${contact.name}-${index}`}
						contact={contact}
					/>
				))}
				{contacts.length > 10 && (
					<div className="px-4 py-3 text-center text-muted-foreground text-sm">
						+ {contacts.length - 10} more contacts
					</div>
				)}
			</div>
		</div>
	);
}

export function FileDropZone({
	accept = ".vcf,.vcard",
	maxSizeMB = 5,
	onFileSelect,
	onFileContent,
	onPreviewParsed,
	disabled = false,
	className,
}: FileDropZoneProps) {
	const [previewContacts, setPreviewContacts] = useState<ParsedContact[]>([]);

	const handleFileContent = (content: string) => {
		const contacts = parseVcardContent(content);
		setPreviewContacts(contacts);
		onPreviewParsed?.(contacts);
		onFileContent?.(content);
	};

	const handleReset = () => {
		setPreviewContacts([]);
	};

	return (
		<BaseFileDropZone
			accept={accept}
			maxSizeMB={maxSizeMB}
			idleText="Drag your .vcf file here"
			onFileSelect={onFileSelect}
			onFileContent={handleFileContent}
			validateFile={validateVcardFile}
			successContent={({ file, onReset }) => (
				<>
					<CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
					<p className="font-medium text-body-large">{file.name}</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{previewContacts.length} contact
						{previewContacts.length !== 1 ? "s" : ""} detected
					</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleReset();
							onReset();
						}}
						className="mt-4"
					>
						<X className="mr-2 h-4 w-4" />
						Change file
					</Button>
				</>
			)}
			previewContent={<ContactsPreview contacts={previewContacts} />}
			disabled={disabled}
			className={className}
		/>
	);
}
