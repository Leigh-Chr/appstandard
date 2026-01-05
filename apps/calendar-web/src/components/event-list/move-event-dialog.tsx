/**
 * Dialog for moving event(s) to another calendar
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { useCalendars } from "@/hooks/use-storage";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

const moveEventSchema = z.object({
	targetCalendarId: z.string().min(1, "Please select a destination calendar"),
});

/**
 * Type for calendar list items returned by the API
 * Matches the structure from packages/api/src/routers/calendar/core.ts
 */
type CalendarListItem = {
	id: string;
	name: string;
	color?: string | null;
	eventCount: number;
	sourceUrl?: string | null;
	lastSyncedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

interface MoveEventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventIds: string[];
	currentCalendarId: string;
	eventCount?: number; // For display purposes (1 for single, multiple for bulk)
}

export function MoveEventDialog({
	open,
	onOpenChange,
	eventIds,
	currentCalendarId,
	eventCount = eventIds.length,
}: MoveEventDialogProps) {
	const queryClient = useQueryClient();

	// Get calendars for move destination
	const { calendars, isLoading: isLoadingCalendars } = useCalendars();

	// Bulk move mutation
	const bulkMoveMutation = useMutation(
		trpc.event.bulkMove.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.event.all });
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(
					`${data.movedCount} event(s) moved to "${data.targetCalendarName}"`,
				);
				onOpenChange(false);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during move";
				toast.error(message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			targetCalendarId: "",
		},
		validators: {
			onSubmit: moveEventSchema,
		},
		onSubmit: async ({ value }) => {
			await bulkMoveMutation.mutateAsync({
				eventIds,
				targetCalendarId: value.targetCalendarId,
			});
		},
	});

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	// Filter calendars to exclude current one
	// Type assertion is safe here because useCalendars returns the same structure as CalendarListItem
	const moveDestinations = Array.isArray(calendars)
		? (calendars as unknown as CalendarListItem[]).filter(
				(c) => c.id !== currentCalendarId,
			)
		: [];

	const isPending = bulkMoveMutation.isPending || form.state.isSubmitting;

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			form.reset();
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Move {eventCount === 1 ? "event" : `${eventCount} events`}
					</DialogTitle>
					<DialogDescription>
						Select the destination calendar for{" "}
						{eventCount === 1 ? "this event" : "these events"}.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="py-4">
						{isLoadingCalendars ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : !moveDestinations || moveDestinations.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
								<CalendarIcon className="h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									No other calendars available. Create a calendar first.
								</p>
							</div>
						) : (
							<form.Field name="targetCalendarId">
								{(field) => (
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
										disabled={isPending}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select destination calendar..." />
										</SelectTrigger>
										<SelectContent>
											{moveDestinations.map((cal: CalendarListItem) => (
												<SelectItem key={cal.id} value={cal.id}>
													<div className="flex items-center gap-2">
														{cal.color && (
															<div
																className="h-3 w-3 rounded-full"
																style={{ backgroundColor: cal.color }}
															/>
														)}
														<span>{cal.name}</span>
														<span className="text-muted-foreground text-xs">
															({cal.eventCount} event
															{cal.eventCount !== 1 ? "s" : ""})
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</form.Field>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								values: state.values,
							})}
						>
							{({ canSubmit, values }) => (
								<Button
									type="submit"
									disabled={
										!canSubmit ||
										isPending ||
										!values.targetCalendarId ||
										moveDestinations.length === 0
									}
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Moving...
										</>
									) : (
										<>
											<ArrowRight className="mr-2 h-4 w-4" />
											Move
										</>
									)}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
