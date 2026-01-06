/**
 * Contact details component
 * Displays secondary information like note preview and counts for contact data
 */

import { useIsMobile } from "@appstandard/react-utils";
import {
	Heart,
	Home,
	Mail,
	MessageCircle,
	Phone,
	StickyNote,
} from "lucide-react";
import type { Contact } from "./types";

interface ContactDetailsProps {
	contact: Contact;
}

/** Secondary info grid showing counts for contact data */
export function ContactSecondaryInfo({ contact }: ContactDetailsProps) {
	const isMobile = useIsMobile();

	// Only show counts beyond primary (already displayed on card)
	const additionalEmails =
		contact.emailCount && contact.emailCount > 1
			? contact.emailCount - 1
			: null;
	const additionalPhones =
		contact.phoneCount && contact.phoneCount > 1
			? contact.phoneCount - 1
			: null;
	const addressCount = contact.addressCount;
	const imHandleCount = contact.imHandleCount;
	const relationCount = contact.relationCount;

	const hasSecondaryInfo =
		additionalEmails ||
		additionalPhones ||
		(addressCount && addressCount > 0) ||
		(imHandleCount && imHandleCount > 0) ||
		(relationCount && relationCount > 0);

	if (!hasSecondaryInfo) return null;

	return (
		<div className="flex flex-wrap items-center gap-3 border-border/40 border-t pt-2 text-muted-foreground text-xs">
			{additionalEmails && additionalEmails > 0 && (
				<span
					className="flex items-center gap-1"
					title={`${contact.emailCount} total email${contact.emailCount && contact.emailCount > 1 ? "s" : ""}`}
				>
					<Mail className="h-3 w-3" />
					<span>+{additionalEmails}</span>
				</span>
			)}
			{additionalPhones && additionalPhones > 0 && (
				<span
					className="flex items-center gap-1"
					title={`${contact.phoneCount} total phone${contact.phoneCount && contact.phoneCount > 1 ? "s" : ""}`}
				>
					<Phone className="h-3 w-3" />
					<span>+{additionalPhones}</span>
				</span>
			)}
			{!isMobile && (
				<>
					{addressCount != null && addressCount > 0 && (
						<span
							className="flex items-center gap-1"
							title={`${addressCount} address${addressCount > 1 ? "es" : ""}`}
						>
							<Home className="h-3 w-3" />
							<span>{addressCount}</span>
						</span>
					)}
					{imHandleCount != null && imHandleCount > 0 && (
						<span
							className="flex items-center gap-1"
							title={`${imHandleCount} messaging account${imHandleCount > 1 ? "s" : ""}`}
						>
							<MessageCircle className="h-3 w-3" />
							<span>{imHandleCount}</span>
						</span>
					)}
					{relationCount != null && relationCount > 0 && (
						<span
							className="flex items-center gap-1"
							title={`${relationCount} relation${relationCount > 1 ? "s" : ""}`}
						>
							<Heart className="h-3 w-3" />
							<span>{relationCount}</span>
						</span>
					)}
				</>
			)}
		</div>
	);
}

/** Contact note preview */
export function ContactNotePreview({ contact }: ContactDetailsProps) {
	if (!contact.note) return null;

	return (
		<div className="flex items-start gap-2 border-border/40 border-t pt-2">
			<StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
			<p className="line-clamp-2 text-muted-foreground text-xs">
				{contact.note}
			</p>
		</div>
	);
}
