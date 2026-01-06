/**
 * Contact card component for list view
 * Displays detailed contact information in a horizontal layout
 */

import { cn } from "@appstandard/react-utils";
import {
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import {
	ArrowRight,
	Building,
	Cake,
	Copy,
	Edit2,
	Globe,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { ContactNotePreview, ContactSecondaryInfo } from "./contact-details";
import type { ContactCardProps } from "./types";
import { formatCategories, formatLocation, formatPosition } from "./types";

export function ContactCard({
	contact,
	addressBookColor,
	onEdit,
	onDuplicate,
	onMove,
	onDelete,
	isDuplicating,
	selectionMode = false,
	isSelected = false,
	onToggleSelect,
}: ContactCardProps) {
	const accentColor = addressBookColor || "#3b82f6";
	const locationStr = formatLocation(contact.primaryAddress);
	const categoriesStr = formatCategories(contact.categories);
	const positionStr = formatPosition(contact);

	const handleCardClick = () => {
		if (selectionMode) {
			onToggleSelect?.(contact.id);
		}
	};

	const handleCheckboxChange = () => {
		onToggleSelect?.(contact.id);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className={cn(
				"group relative flex overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md",
				selectionMode && "cursor-pointer",
				isSelected && "bg-primary/5 ring-2 ring-primary",
			)}
			onClick={selectionMode ? handleCardClick : undefined}
		>
			{/* Color accent bar */}
			<div
				className="w-1 shrink-0 transition-all group-hover:w-1.5"
				style={{ backgroundColor: accentColor }}
			/>

			<div className="flex min-w-0 flex-1 items-start gap-4 p-4">
				{/* Selection checkbox */}
				{selectionMode && (
					<div className="flex items-center">
						<Checkbox
							checked={isSelected}
							onCheckedChange={handleCheckboxChange}
							onClick={(e) => e.stopPropagation()}
							aria-label={`Select ${contact.formattedName}`}
						/>
					</div>
				)}

				{/* Avatar */}
				<div
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
					style={{ backgroundColor: `${accentColor}20` }}
				>
					<User className="h-5 w-5" style={{ color: accentColor }} />
				</div>

				{/* Contact info */}
				<div className="min-w-0 flex-1 space-y-1">
					{/* Name row with badges */}
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-medium">{contact.formattedName}</h3>
						{contact.nickname && (
							<span className="text-muted-foreground text-sm">
								"{contact.nickname}"
							</span>
						)}
						{/* Inline badges */}
						<div className="flex gap-1">
							{contact.birthday && (
								<span
									className="rounded-full bg-pink-100 p-0.5 dark:bg-pink-900/30"
									title={`Birthday: ${new Date(contact.birthday).toLocaleDateString()}`}
								>
									<Cake className="h-2.5 w-2.5 text-pink-600 dark:text-pink-400" />
								</span>
							)}
						</div>
					</div>

					{/* Title/Role at Organization */}
					{positionStr && (
						<p className="text-muted-foreground text-sm">{positionStr}</p>
					)}

					{/* Contact details */}
					<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
						{contact.primaryEmail && (
							<a
								href={`mailto:${contact.primaryEmail}`}
								className="flex items-center gap-1 hover:text-primary"
								onClick={(e) => e.stopPropagation()}
							>
								<Mail className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{contact.primaryEmail}</span>
							</a>
						)}
						{contact.primaryPhone && (
							<a
								href={`tel:${contact.primaryPhone}`}
								className="flex items-center gap-1 hover:text-primary"
								onClick={(e) => e.stopPropagation()}
							>
								<Phone className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{contact.primaryPhone}</span>
							</a>
						)}
						{locationStr && (
							<span className="flex items-center gap-1">
								<MapPin className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{locationStr}</span>
							</span>
						)}
						{contact.organization &&
							!positionStr?.includes(contact.organization) && (
								<span className="flex items-center gap-1">
									<Building className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">
										{contact.organization}
									</span>
								</span>
							)}
						{contact.url && (
							<a
								href={contact.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 hover:text-primary"
								onClick={(e) => e.stopPropagation()}
							>
								<Globe className="h-3.5 w-3.5" />
							</a>
						)}
					</div>

					{/* Categories */}
					{categoriesStr && (
						<div className="flex items-center gap-1 pt-1 text-muted-foreground text-xs">
							<Tag className="h-3 w-3" />
							<span className="line-clamp-1">{categoriesStr}</span>
						</div>
					)}

					{/* Secondary info (additional emails, phones, addresses, IM handles, relations) */}
					<ContactSecondaryInfo contact={contact} />

					{/* Note preview */}
					<ContactNotePreview contact={contact} />
				</div>

				{/* Actions - hide in selection mode */}
				{!selectionMode && (
					<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							type="button"
							onClick={() => onEdit(contact.id)}
							className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							<Edit2 className="h-4 w-4" />
						</button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="rounded p-1.5 text-muted-foreground hover:bg-muted"
								>
									<MoreHorizontal className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onEdit(contact.id)}>
									<Edit2 className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDuplicate(contact.id)}
									disabled={isDuplicating}
								>
									<Copy className="mr-2 h-4 w-4" />
									Duplicate
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onMove(contact.id)}>
									<ArrowRight className="mr-2 h-4 w-4" />
									Move to address book...
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => onDelete(contact.id, contact.formattedName)}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>
		</motion.div>
	);
}
