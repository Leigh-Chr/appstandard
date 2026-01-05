/**
 * Quick Create Event - Quick modal to create an event
 * Displays on calendar slot click for simplified creation
 */

import { useIsMobile } from "@appstandard/react-utils";
import {
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@appstandard/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Calendar,
	ChevronRight,
	Clock,
	Loader2,
	MapPin,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

const quickCreateSchema = z.object({
	title: z.string().min(1, "Title is required"),
	location: z.string(),
});

interface QuickCreateEventProps {
	calendarId: string;
	startDate: Date;
	endDate: Date;
	onClose: () => void;
	onOpenFullForm: (data: { title: string; start: Date; end: Date }) => void;
	isOpen: boolean;
}

// Quick duration presets
const DURATION_PRESETS = [
	{ label: "30 min", minutes: 30 },
	{ label: "1h", minutes: 60 },
	{ label: "2h", minutes: 120 },
	{ label: "All day", allDay: true },
];

export function QuickCreateEvent({
	calendarId,
	startDate,
	endDate,
	onClose,
	onOpenFullForm,
	isOpen,
}: QuickCreateEventProps) {
	const [showLocation, setShowLocation] = useState(false);
	const [currentEndDate, setCurrentEndDate] = useState(endDate);
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();

	const form = useForm({
		defaultValues: {
			title: "",
			location: "",
		},
		validators: {
			onSubmit: quickCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createMutation.mutateAsync({
				calendarId,
				title: value.title.trim(),
				startDate: startDate.toISOString(),
				endDate: currentEndDate.toISOString(),
				location: value.location?.trim() || undefined,
			});
		},
	});

	// Reset state when opening
	useEffect(() => {
		if (isOpen) {
			form.reset();
			setShowLocation(false);
			setCurrentEndDate(endDate);
			// Focus input after a small delay to ensure popover is mounted
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen, endDate, form]);

	const createMutation = useMutation(
		trpc.event.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.event.all });
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.byId(calendarId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Event created!");
				onClose();
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during creation";
				toast.error(message);
			},
		}),
	);

	const handleDurationChange = (preset: (typeof DURATION_PRESETS)[number]) => {
		if (preset.allDay) {
			// Set to full day
			const newEnd = new Date(startDate);
			newEnd.setHours(23, 59, 59, 999);
			setCurrentEndDate(newEnd);
		} else if (preset.minutes) {
			const newEnd = new Date(startDate.getTime() + preset.minutes * 60000);
			setCurrentEndDate(newEnd);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			form.handleSubmit();
		} else if (e.key === "Escape") {
			onClose();
		}
	};

	const handleMoreOptions = () => {
		const title = form.getFieldValue("title");
		onOpenFullForm({
			title: title?.trim() || "",
			start: startDate,
			end: currentEndDate,
		});
		onClose();
	};

	// Format date display
	const formatDateRange = () => {
		const sameDay = startDate.toDateString() === currentEndDate.toDateString();
		if (sameDay) {
			return `${format(startDate, "EEEE d MMMM", { locale: enUS })}, ${format(startDate, "HH:mm")} - ${format(currentEndDate, "HH:mm")}`;
		}
		return `${format(startDate, "d MMM HH:mm", { locale: enUS })} - ${format(currentEndDate, "d MMM HH:mm", { locale: enUS })}`;
	};

	const isPending = createMutation.isPending || form.state.isSubmitting;

	return (
		<Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<PopoverTrigger asChild>
				<span />
			</PopoverTrigger>
			<PopoverContent
				className="w-full max-w-sm p-0 shadow-xl sm:w-96"
				side={isMobile ? "bottom" : "right"}
				align={isMobile ? "center" : "start"}
				sideOffset={isMobile ? 8 : 8}
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					{/* Header */}
					<div className="flex items-center justify-between border-b p-3">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Calendar className="h-4 w-4" />
							<span>New event</span>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-10 min-h-[44px] w-10 sm:h-6 sm:min-h-0 sm:w-6"
							onClick={onClose}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Content */}
					<div className="space-y-4 p-4">
						{/* Title Input */}
						<form.Field name="title">
							{(field) => (
								<Input
									ref={inputRef}
									id={field.name}
									name={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									onKeyDown={handleKeyDown}
									placeholder="Event title"
									className="border-0 p-0 font-medium text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0"
									disabled={isPending}
								/>
							)}
						</form.Field>

						{/* Date & Time */}
						<div className="flex items-center gap-2 text-sm">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">{formatDateRange()}</span>
						</div>

						{/* Duration Presets */}
						<div className="flex flex-wrap gap-2">
							{DURATION_PRESETS.map((preset) => (
								<Button
									key={preset.label}
									type="button"
									variant="outline"
									size="sm"
									className="h-10 min-h-[44px] text-xs sm:h-7 sm:min-h-0"
									onClick={() => {
										handleDurationChange(preset);
									}}
									disabled={isPending}
								>
									{preset.label}
								</Button>
							))}
						</div>

						{/* Location (toggle) */}
						{showLocation ? (
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<form.Field name="location">
									{(field) => (
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Location"
											className="h-8 flex-1"
											disabled={isPending}
											autoFocus
										/>
									)}
								</form.Field>
							</div>
						) : (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setShowLocation(true)}
								disabled={isPending}
								className="min-h-[44px] justify-start text-muted-foreground sm:min-h-0"
							>
								<MapPin className="h-4 w-4" />
								<span>Add a location</span>
							</Button>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between border-t bg-muted/30 p-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleMoreOptions}
							disabled={isPending}
							className="text-muted-foreground"
						>
							More options
							<ChevronRight className="ml-1 h-4 w-4" />
						</Button>
						<form.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button
									type="submit"
									size="sm"
									disabled={!canSubmit || isPending}
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Creating...
										</>
									) : (
										"Create"
									)}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Hook to manage quick create state
 */
export function useQuickCreate() {
	const [state, setState] = useState<{
		isOpen: boolean;
		startDate: Date;
		endDate: Date;
	}>({
		isOpen: false,
		startDate: new Date(),
		endDate: new Date(),
	});

	// React Compiler will automatically memoize these callbacks
	const open = (startDate: Date, endDate: Date) => {
		setState({ isOpen: true, startDate, endDate });
	};

	const close = () => {
		setState((prev) => ({ ...prev, isOpen: false }));
	};

	return { ...state, open, close };
}
