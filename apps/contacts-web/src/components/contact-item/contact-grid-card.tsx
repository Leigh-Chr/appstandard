/**
 * Contact card component for grid view
 * Compact card with centered avatar and essential info
 */

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import {
	ArrowRight,
	Cake,
	Copy,
	Edit2,
	Globe,
	Heart,
	Mail,
	MapPin,
	MessageCircle,
	MoreHorizontal,
	Phone,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { ContactHoverPreview } from "./contact-hover-preview";
import type { ContactGridCardProps } from "./types";
import { formatCategories, formatLocation, formatPosition } from "./types";

export function ContactGridCard({
	contact,
	addressBookColor,
	onEdit,
	onDuplicate,
	onMove,
	onDelete,
	isDuplicating,
}: ContactGridCardProps) {
	const accentColor = addressBookColor || "#3b82f6";
	const locationStr = formatLocation(contact.primaryAddress);
	const categoriesStr = formatCategories(contact.categories);
	const positionStr = formatPosition(contact);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="group relative flex overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md"
		>
			{/* Color accent bar */}
			<div
				className="w-1 shrink-0 transition-all group-hover:w-1.5"
				style={{ backgroundColor: accentColor }}
			/>

			<div className="flex flex-1 flex-col items-center p-4 text-center">
				<ContactHoverPreview
					contact={contact}
					addressBookColor={addressBookColor}
				>
					<div className="cursor-default">
						{/* Avatar */}
						<div
							className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
							style={{ backgroundColor: `${accentColor}20` }}
						>
							<User className="h-7 w-7" style={{ color: accentColor }} />
						</div>

						{/* Name */}
						<p className="mb-0.5 line-clamp-1 font-medium text-sm">
							{contact.formattedName}
						</p>

						{/* Nickname */}
						{contact.nickname && (
							<p className="mb-1 text-muted-foreground text-xs">
								"{contact.nickname}"
							</p>
						)}

						{/* Title/Role at Organization */}
						{positionStr && (
							<p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
								{positionStr}
							</p>
						)}
					</div>
				</ContactHoverPreview>

				{/* Info badges */}
				<div className="mb-2 flex flex-wrap justify-center gap-1">
					{contact.primaryEmail && (
						<span
							className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/30"
							title={contact.primaryEmail}
						>
							<Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
						</span>
					)}
					{contact.primaryPhone && (
						<span
							className="rounded-full bg-green-100 p-1 dark:bg-green-900/30"
							title={contact.primaryPhone}
						>
							<Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
						</span>
					)}
					{locationStr && (
						<span
							className="rounded-full bg-amber-100 p-1 dark:bg-amber-900/30"
							title={locationStr}
						>
							<MapPin className="h-3 w-3 text-amber-600 dark:text-amber-400" />
						</span>
					)}
					{contact.birthday && (
						<span
							className="rounded-full bg-pink-100 p-1 dark:bg-pink-900/30"
							title={`Birthday: ${new Date(contact.birthday).toLocaleDateString()}`}
						>
							<Cake className="h-3 w-3 text-pink-600 dark:text-pink-400" />
						</span>
					)}
					{contact.url && (
						<span
							className="rounded-full bg-cyan-100 p-1 dark:bg-cyan-900/30"
							title={contact.url}
						>
							<Globe className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
						</span>
					)}
					{contact.imHandleCount != null && contact.imHandleCount > 0 && (
						<span
							className="rounded-full bg-violet-100 p-1 dark:bg-violet-900/30"
							title={`${contact.imHandleCount} messaging account${contact.imHandleCount > 1 ? "s" : ""}`}
						>
							<MessageCircle className="h-3 w-3 text-violet-600 dark:text-violet-400" />
						</span>
					)}
					{contact.relationCount != null && contact.relationCount > 0 && (
						<span
							className="rounded-full bg-rose-100 p-1 dark:bg-rose-900/30"
							title={`${contact.relationCount} relation${contact.relationCount > 1 ? "s" : ""}`}
						>
							<Heart className="h-3 w-3 text-rose-600 dark:text-rose-400" />
						</span>
					)}
				</div>

				{/* Categories */}
				{categoriesStr && (
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
						<Tag className="h-2.5 w-2.5" />
						<span className="line-clamp-1">{categoriesStr}</span>
					</div>
				)}

				{/* Hover actions */}
				<div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={() => onEdit(contact.id)}
						className="rounded bg-background/80 p-1 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
					>
						<Edit2 className="h-3.5 w-3.5" />
					</button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="rounded bg-background/80 p-1 text-muted-foreground shadow-sm hover:bg-muted"
							>
								<MoreHorizontal className="h-3.5 w-3.5" />
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
			</div>
		</motion.div>
	);
}
