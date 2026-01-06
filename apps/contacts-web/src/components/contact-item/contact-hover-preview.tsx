/**
 * Contact hover preview component
 * Shows detailed contact information in a hover card
 */

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@appstandard/ui";
import {
	Building,
	Cake,
	Globe,
	Heart,
	Home,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
	StickyNote,
	Tag,
	User,
} from "lucide-react";
import type { Contact } from "./types";
import { formatCategories, formatLocation, formatPosition } from "./types";

interface ContactHoverPreviewProps {
	contact: Contact;
	children: React.ReactNode;
	addressBookColor?: string | null;
}

export function ContactHoverPreview({
	contact,
	children,
	addressBookColor,
}: ContactHoverPreviewProps) {
	const accentColor = addressBookColor || "#3b82f6";
	const locationStr = formatLocation(contact.primaryAddress);
	const categoriesStr = formatCategories(contact.categories);
	const positionStr = formatPosition(contact);

	return (
		<HoverCard openDelay={400} closeDelay={100}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent
				side="right"
				align="start"
				className="w-80 max-w-[calc(100vw-2rem)]"
			>
				<div className="space-y-3">
					{/* Header with avatar */}
					<div className="flex items-start gap-3">
						<div
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
							style={{ backgroundColor: `${accentColor}20` }}
						>
							<User className="h-5 w-5" style={{ color: accentColor }} />
						</div>
						<div className="min-w-0 flex-1">
							<h4 className="line-clamp-1 font-semibold text-sm">
								{contact.formattedName}
							</h4>
							{contact.nickname && (
								<p className="text-muted-foreground text-xs">
									"{contact.nickname}"
								</p>
							)}
						</div>
					</div>

					{/* Position/Organization */}
					{positionStr && (
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Building className="h-3.5 w-3.5 shrink-0" />
							<span className="line-clamp-1">{positionStr}</span>
						</div>
					)}

					{/* Contact methods */}
					<div className="space-y-1.5">
						{contact.primaryEmail && (
							<a
								href={`mailto:${contact.primaryEmail}`}
								className="flex items-center gap-2 text-xs hover:text-primary"
								onClick={(e) => e.stopPropagation()}
							>
								<Mail className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
								<span className="truncate">{contact.primaryEmail}</span>
								{contact.emailCount && contact.emailCount > 1 && (
									<span className="text-muted-foreground">
										+{contact.emailCount - 1}
									</span>
								)}
							</a>
						)}
						{contact.primaryPhone && (
							<a
								href={`tel:${contact.primaryPhone}`}
								className="flex items-center gap-2 text-xs hover:text-primary"
								onClick={(e) => e.stopPropagation()}
							>
								<Phone className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
								<span>{contact.primaryPhone}</span>
								{contact.phoneCount && contact.phoneCount > 1 && (
									<span className="text-muted-foreground">
										+{contact.phoneCount - 1}
									</span>
								)}
							</a>
						)}
					</div>

					{/* Note preview */}
					{contact.note && (
						<div className="flex items-start gap-2 text-muted-foreground text-xs">
							<StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
							<p className="line-clamp-2">{contact.note}</p>
						</div>
					)}

					{/* Metadata grid */}
					<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-border/40 border-t pt-3 text-muted-foreground text-xs">
						{locationStr && (
							<div className="flex items-center gap-1.5">
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="truncate">{locationStr}</span>
							</div>
						)}
						{contact.birthday && (
							<div className="flex items-center gap-1.5">
								<Cake className="h-3 w-3 shrink-0" />
								<span>
									{new Date(contact.birthday).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})}
								</span>
							</div>
						)}
						{contact.url && (
							<div className="flex items-center gap-1.5">
								<Globe className="h-3 w-3 shrink-0" />
								<a
									href={contact.url}
									target="_blank"
									rel="noopener noreferrer"
									className="truncate hover:text-primary"
									onClick={(e) => e.stopPropagation()}
								>
									Website
								</a>
							</div>
						)}
						{categoriesStr && (
							<div className="col-span-2 flex items-center gap-1.5">
								<Tag className="h-3 w-3 shrink-0" />
								<span className="truncate">{categoriesStr}</span>
							</div>
						)}
					</div>

					{/* Additional info badges */}
					{(contact.addressCount ||
						contact.imHandleCount ||
						contact.relationCount) && (
						<div className="flex flex-wrap gap-1.5">
							{contact.addressCount != null && contact.addressCount > 0 && (
								<span className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
									<Home className="h-2.5 w-2.5" />
									{contact.addressCount} address
									{contact.addressCount > 1 ? "es" : ""}
								</span>
							)}
							{contact.imHandleCount != null && contact.imHandleCount > 0 && (
								<span className="flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
									<MessageCircle className="h-2.5 w-2.5" />
									{contact.imHandleCount} messaging
								</span>
							)}
							{contact.relationCount != null && contact.relationCount > 0 && (
								<span className="flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
									<Heart className="h-2.5 w-2.5" />
									{contact.relationCount} relation
									{contact.relationCount > 1 ? "s" : ""}
								</span>
							)}
						</div>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
