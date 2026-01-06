/**
 * Event card component with smooth animations
 * Supports selection mode for bulk operations
 */

import { cn } from "@appstandard/react-utils";
// React Compiler will automatically memoize this component and its callbacks
import {
	Card,
	CardContent,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { EventBadges } from "./event-badges";
import { EventDetails } from "./event-details";
import type { EventItem } from "./types";

interface EventCardProps {
	event: EventItem;
	calendarId: string;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onDuplicate?: (id: string) => void;
	onMove?: (id: string) => void;
	isDeleting: boolean;
	isDuplicating?: boolean;
	/** Selection mode props */
	selectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

export function EventCard({
	event,
	calendarId,
	onEdit,
	onDelete,
	onDuplicate,
	onMove,
	isDeleting,
	isDuplicating,
	selectionMode = false,
	isSelected = false,
	onToggleSelect,
}: EventCardProps) {
	const navigate = useNavigate();

	// React Compiler will automatically memoize these callbacks
	const handleNavigate = () => {
		if (selectionMode) {
			onToggleSelect?.(event.id);
		} else {
			navigate({ to: `/calendars/${calendarId}/events/${event.id}` });
		}
	};

	const handleEdit = () => {
		onEdit(event.id);
	};

	const handleDelete = () => {
		onDelete(event.id);
	};

	const handleDuplicate = () => {
		onDuplicate?.(event.id);
	};

	const handleMove = () => {
		onMove?.(event.id);
	};

	const handleCheckboxChange = (_checked: boolean) => {
		onToggleSelect?.(event.id);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
			transition={{
				type: "spring",
				stiffness: 350,
				damping: 25,
			}}
		>
			<Card
				className={cn(
					"group relative overflow-hidden transition-all duration-200 hover:shadow-md",
					selectionMode && "cursor-pointer",
					isSelected && "bg-primary/5 ring-2 ring-primary",
				)}
				onClick={selectionMode ? handleNavigate : undefined}
			>
				{/* Color accent bar - left border like CalendarCard */}
				<div
					className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
					style={{ backgroundColor: event.color || "#D4A017" }}
				/>

				<CardContent className="py-4 pr-6 pl-6">
					<div className="flex items-start gap-3">
						{/* Selection checkbox */}
						{selectionMode && (
							<div className="flex items-center">
								<Checkbox
									checked={isSelected}
									onCheckedChange={handleCheckboxChange}
									onClick={(e) => e.stopPropagation()}
									aria-label={`Select ${event.title}`}
								/>
							</div>
						)}

						<div className="min-w-0 flex-1">
							<EventBadges event={event} />
							<EventDetails event={event} />
						</div>

						{/* Actions - hide in selection mode, show on hover like Tasks/Contacts */}
						{!selectionMode && (
							<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									type="button"
									onClick={handleEdit}
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
										<DropdownMenuItem onClick={handleEdit}>
											<Edit2 className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										{onDuplicate && (
											<DropdownMenuItem
												onClick={handleDuplicate}
												disabled={isDuplicating}
											>
												<Copy className="mr-2 h-4 w-4" />
												Duplicate
											</DropdownMenuItem>
										)}
										{onMove && (
											<DropdownMenuItem onClick={handleMove}>
												<ArrowRight className="mr-2 h-4 w-4" />
												Move to calendar...
											</DropdownMenuItem>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleDelete}
											disabled={isDeleting}
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
				</CardContent>
			</Card>
		</motion.div>
	);
}
