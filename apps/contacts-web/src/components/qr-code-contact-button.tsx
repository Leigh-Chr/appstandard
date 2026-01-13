/**
 * QR Code Contact Button
 * Generates a QR code with vCard data for a single contact
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	QRCodeDisplay,
} from "@appstandard/ui";
import {
	type ContactKindValue,
	type GenderValue,
	generateSingleVCard,
} from "@appstandard-contacts/vcard-utils";
import { QrCode } from "lucide-react";
import { useMemo, useState } from "react";

// Maximum size for QR code data (in bytes) to ensure readability
const MAX_QR_DATA_SIZE = 2500;

interface ContactData {
	id: string;
	formattedName: string;
	givenName?: string | null;
	familyName?: string | null;
	additionalName?: string | null;
	namePrefix?: string | null;
	nameSuffix?: string | null;
	nickname?: string | null;
	organization?: string | null;
	title?: string | null;
	role?: string | null;
	birthday?: Date | string | null;
	anniversary?: Date | string | null;
	gender?: string | null;
	kind?: string | null;
	photoUrl?: string | null;
	url?: string | null;
	note?: string | null;
	uid?: string | null;
	emails?: Array<{
		email: string;
		type?: string | null;
		isPrimary?: boolean;
	}>;
	phones?: Array<{
		number: string;
		type?: string | null;
		isPrimary?: boolean;
	}>;
	addresses?: Array<{
		type?: string | null;
		streetAddress?: string | null;
		locality?: string | null;
		region?: string | null;
		postalCode?: string | null;
		country?: string | null;
		isPrimary?: boolean;
	}>;
}

interface QRCodeContactButtonProps {
	contact: ContactData;
	className?: string;
}

export function QRCodeContactButton({
	contact,
	className,
}: QRCodeContactButtonProps) {
	const [open, setOpen] = useState(false);

	// Generate vCard content for the contact
	const { vcardContent, isTooLarge } = useMemo(() => {
		const contactInput = {
			uid: contact.uid || `${contact.id}@appstandard`,
			formattedName: contact.formattedName,
			givenName: contact.givenName || undefined,
			familyName: contact.familyName || undefined,
			additionalName: contact.additionalName || undefined,
			namePrefix: contact.namePrefix || undefined,
			nameSuffix: contact.nameSuffix || undefined,
			nickname: contact.nickname || undefined,
			organization: contact.organization || undefined,
			title: contact.title || undefined,
			role: contact.role || undefined,
			birthday: contact.birthday ? new Date(contact.birthday) : undefined,
			anniversary: contact.anniversary
				? new Date(contact.anniversary)
				: undefined,
			gender: (contact.gender as GenderValue) || undefined,
			kind: (contact.kind as ContactKindValue) || undefined,
			photoUrl: contact.photoUrl || undefined,
			url: contact.url || undefined,
			note: contact.note || undefined,
			emails: contact.emails?.map((e) => ({
				email: e.email,
				type: e.type || undefined,
				isPrimary: e.isPrimary,
			})),
			phones: contact.phones?.map((p) => ({
				number: p.number,
				type: p.type || undefined,
				isPrimary: p.isPrimary,
			})),
			addresses: contact.addresses?.map((a) => ({
				type: a.type || undefined,
				streetAddress: a.streetAddress || undefined,
				locality: a.locality || undefined,
				region: a.region || undefined,
				postalCode: a.postalCode || undefined,
				country: a.country || undefined,
				isPrimary: a.isPrimary,
			})),
		};

		const content = generateSingleVCard(contactInput);

		return {
			vcardContent: content,
			isTooLarge: new Blob([content]).size > MAX_QR_DATA_SIZE,
		};
	}, [contact]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				className={className}
			>
				<QrCode className="mr-2 h-4 w-4" />
				QR Code
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<QrCode className="h-5 w-5" />
							Contact QR Code
						</DialogTitle>
						<DialogDescription>
							{isTooLarge
								? "This contact has too much data for a QR code. Try removing some details or use the address book share feature instead."
								: "Scan this QR code to add this contact to your phone"}
						</DialogDescription>
					</DialogHeader>

					{isTooLarge ? (
						<div className="py-8 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<QrCode className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground text-sm">
								Contact data exceeds QR code capacity.
								<br />
								Use address book sharing for complex contacts.
							</p>
						</div>
					) : (
						<QRCodeDisplay
							value={vcardContent}
							size={200}
							title={contact.formattedName}
							description="Scan to add to contacts"
							downloadFilename={`${contact.formattedName.replace(/\s+/g, "-").toLowerCase()}-contact`}
							showCopyButton={false}
							showDownloadButton
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
