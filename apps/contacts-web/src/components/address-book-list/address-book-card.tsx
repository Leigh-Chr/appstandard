/**
 * Address Book Card Component
 * Displays a single address book with actions and contact preview
 */

import { cn, useIsMobile } from "@appstandard/react-utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Edit,
	ExternalLink,
	Globe,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { AddressBookGroupBadges } from "./group-badges";

interface AddressBookCardProps {
	addressBook: {
		id: string;
		name: string;
		contactCount: number;
		color?: string | null;
		sourceUrl?: string | null;
		lastSyncedAt?: string | Date | null;
		contacts?: Array<{
			id: string;
			formattedName: string;
			organization?: string | null;
			photoUrl?: string | null;
		}>;
	};
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
	isDeleting: boolean;
	isUpdating: boolean;
	/** Selection mode props */
	selectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

export function AddressBookCard({
	addressBook,
	onOpen,
	onEdit,
	onDelete,
	isDeleting,
	isUpdating,
	selectionMode = false,
	isSelected = false,
	onToggleSelect,
}: AddressBookCardProps) {
	const isMobile = useIsMobile();

	// Get contacts for preview (already ordered by API)
	const previewContacts = addressBook.contacts || [];

	const handleNavigate = () => {
		if (selectionMode) {
			onToggleSelect?.(addressBook.id);
		} else {
			onOpen();
		}
	};

	const handleCheckboxChange = (_checked: boolean) => {
		onToggleSelect?.(addressBook.id);
	};

	return (
		<Card
			className={cn(
				"group relative cursor-pointer overflow-hidden transition-all duration-200",
				"hover:border-primary/30 hover:shadow-lg",
				selectionMode && "cursor-pointer",
				isSelected && "bg-primary/5 ring-2 ring-primary",
			)}
			onClick={selectionMode ? handleNavigate : onOpen}
		>
			{/* Color accent - left border */}
			<div
				className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
				style={{ backgroundColor: addressBook.color || "#3b82f6" }}
			/>

			<CardHeader className="pb-2 pl-5">
				<div className="flex items-start justify-between">
					{/* Selection checkbox */}
					{selectionMode && (
						<div className="mr-3 flex items-center pt-0.5">
							<Checkbox
								checked={isSelected}
								onCheckedChange={handleCheckboxChange}
								onClick={(e) => e.stopPropagation()}
								aria-label={`Select ${addressBook.name}`}
							/>
						</div>
					)}
					<div className="min-w-0 flex-1 pr-8">
						<CardTitle className="line-clamp-1 text-card-title">
							{addressBook.name}
						</CardTitle>
						<AddressBookGroupBadges addressBookId={addressBook.id} />
						<CardDescription className="mt-0.5 flex flex-wrap items-center gap-2">
							<span>
								{addressBook.contactCount} contact
								{addressBook.contactCount !== 1 ? "s" : ""}
							</span>
							{addressBook.sourceUrl && (
								<span
									className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 font-medium text-blue-600 text-xs dark:text-blue-400"
									title={
										addressBook.lastSyncedAt
											? `Subscribed to ${addressBook.sourceUrl}. Last synced ${formatDistanceToNow(new Date(addressBook.lastSyncedAt), { addSuffix: true, locale: enUS })}`
											: `Subscribed to ${addressBook.sourceUrl}`
									}
								>
									<Globe className="h-3 w-3" />
									Subscribed
								</span>
							)}
						</CardDescription>
					</div>

					{/* Actions Menu - hide in selection mode */}
					{!selectionMode && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"absolute top-2 right-2 h-10 min-h-[44px] w-10 sm:h-8 sm:min-h-0 sm:w-8",
										isMobile
											? "opacity-100"
											: "opacity-0 transition-opacity group-hover:opacity-100",
									)}
									aria-label="Address book actions"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onOpen();
									}}
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onEdit();
									}}
									disabled={isUpdating}
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onDelete();
									}}
									disabled={isDeleting}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			<CardContent className="pt-0 pl-5">
				{/* Contact preview - similar to calendar's event preview */}
				{previewContacts.length > 0 ? (
					<div className="space-y-1">
						{previewContacts.map((contact, index) => (
							<div
								key={contact.id}
								className={cn(
									"flex items-center gap-2 text-xs",
									index === 0 ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{contact.photoUrl ? (
									<img
										src={contact.photoUrl}
										alt=""
										className="h-4 w-4 shrink-0 rounded-full object-cover"
									/>
								) : (
									<span
										className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] text-white"
										style={{ backgroundColor: addressBook.color || "#3b82f6" }}
									>
										{contact.formattedName.charAt(0).toUpperCase()}
									</span>
								)}
								<span className="truncate">{contact.formattedName}</span>
								{contact.organization && (
									<span className="truncate text-muted-foreground/60">
										· {contact.organization}
									</span>
								)}
							</div>
						))}
						{addressBook.contactCount > 3 && (
							<p className="mt-1 text-muted-foreground/60 text-xs">
								+{addressBook.contactCount - 3} others
							</p>
						)}
					</div>
				) : (
					<p className="py-2 text-center text-muted-foreground/50 text-xs italic">
						No contacts yet
					</p>
				)}
			</CardContent>
		</Card>
	);
}
