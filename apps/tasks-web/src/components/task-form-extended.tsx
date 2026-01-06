/**
 * Extended task form component with full RFC 5545 VTODO support
 * Based on Calendar's EventFormExtended pattern
 *
 * Features:
 * - CollapsibleSection for organized form sections
 * - Real-time validation
 * - Mobile progress indicator
 * - Modification tracking
 * - Attendees, Alarms, Recurrence, Attachments support
 */

import { useFormTracking, useIsMobile } from "@appstandard/react-utils";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CollapsibleSection,
	MobileFormProgress,
} from "@appstandard/ui";
import { format } from "date-fns";
import {
	Bell,
	Calendar,
	FileText,
	Loader2,
	Paperclip,
	Repeat,
	Settings,
	Users,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	AdditionalInfoSection,
	AlarmsSection,
	AttachmentsSection,
	AttendeesSection,
	BasicInfoSection,
	DatesSection,
	RecurrenceSection,
} from "@/components/task-form";
import {
	hasValidationErrors,
	type TaskFormData,
	validateDates,
	validateTaskForm,
	validateTitle,
	validateUrl,
} from "@/lib/task-form-validation";

// Re-export type for backward compatibility
export type { TaskFormData } from "@/lib/task-form-validation";

interface AttendeeData {
	email: string;
	name?: string;
	role?: string;
	status?: string;
	rsvp?: boolean;
}

interface AlarmData {
	trigger: string;
	action: string;
}

interface AttachmentData {
	uri?: string;
	filename?: string;
}

interface TaskFormExtendedProps {
	mode: "create" | "edit";
	initialData?: Partial<TaskFormData>;
	onSubmit: (data: TaskFormData) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	taskListId: string;
}

function initializeFormData(data?: Partial<TaskFormData>): TaskFormData {
	return {
		title: data?.title || "",
		description: data?.description || "",
		status: data?.status || "NEEDS_ACTION",
		priority: data?.priority,
		percentComplete: data?.percentComplete ?? 0,
		dueDate: data?.dueDate || "",
		startDate: data?.startDate || "",
		location: data?.location || "",
		url: data?.url || "",
		categories: data?.categories || "",
		color: data?.color || "#22c55e",
		rrule: data?.rrule || "",
		attendees: data?.attendees || [],
		alarms: data?.alarms || [],
		attachments: data?.attachments || [],
	};
}

export function TaskFormExtended({
	mode,
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: TaskFormExtendedProps) {
	// Form state
	const [formData, setFormData] = useState<TaskFormData>(() =>
		initializeFormData(initialData),
	);
	const [initialFormData, setInitialFormData] = useState<TaskFormData | null>(
		null,
	);

	// Date/time split state
	const [startTime, setStartTime] = useState(() => {
		if (initialData?.startDate) {
			try {
				return format(new Date(initialData.startDate), "HH:mm");
			} catch {
				return "";
			}
		}
		return "";
	});
	const [dueTime, setDueTime] = useState(() => {
		if (initialData?.dueDate) {
			try {
				return format(new Date(initialData.dueDate), "HH:mm");
			} catch {
				return "";
			}
		}
		return "";
	});

	// Section expansion state
	const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
		const sections = new Set<string>(["basic"]);
		if (initialData?.dueDate || initialData?.startDate) sections.add("dates");
		if (initialData?.attendees?.length) sections.add("attendees");
		if (initialData?.alarms?.length) sections.add("alarms");
		if (initialData?.rrule) sections.add("recurrence");
		if (initialData?.attachments?.length) sections.add("attachments");
		return sections;
	});

	// Validation state
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string | undefined>
	>({});
	const [attendeeErrors, setAttendeeErrors] = useState<Record<number, string>>(
		{},
	);

	// Mobile progress tracking
	const isMobile = useIsMobile();
	const formRef = useRef<HTMLFormElement>(null);
	const [currentSection, setCurrentSection] = useState(1);
	const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	// Form tracking
	const { hasModifications, resetTracking } = useFormTracking({
		initialData: initialFormData,
		currentData: formData,
		warnOnUnload: mode === "edit",
	});

	// Initialize form data
	useEffect(() => {
		if (initialData) {
			const newFormData = initializeFormData(initialData);
			setFormData(newFormData);
			setInitialFormData(newFormData);
		}
	}, [initialData]);

	// Mobile section tracking with IntersectionObserver
	useEffect(() => {
		if (!isMobile || !formRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				let maxVisible = 0;
				let currentSectionId = "basic";

				for (const entry of entries) {
					if (entry.isIntersecting && entry.intersectionRatio > maxVisible) {
						maxVisible = entry.intersectionRatio;
						currentSectionId =
							entry.target.getAttribute("data-section-id") || "basic";
					}
				}

				const sectionMap: Record<string, number> = {
					basic: 1,
					dates: 2,
					attendees: 3,
					alarms: 4,
					recurrence: 5,
					attachments: 6,
					additional: 7,
				};

				const sectionNumber = sectionMap[currentSectionId];
				if (sectionNumber !== undefined) {
					setCurrentSection(sectionNumber);
				}
			},
			{
				threshold: [0, 0.25, 0.5, 0.75, 1],
				rootMargin: "-100px 0px -50% 0px",
			},
		);

		const timeoutId = setTimeout(() => {
			sectionRefs.current.forEach((ref) => {
				if (ref) observer.observe(ref);
			});
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			observer.disconnect();
		};
	}, [isMobile]);

	const setSectionRef = (id: string) => (el: HTMLDivElement | null) => {
		if (el) {
			sectionRefs.current.set(id, el);
		} else {
			sectionRefs.current.delete(id);
		}
	};

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(section)) {
				next.delete(section);
			} else {
				next.add(section);
			}
			return next;
		});
	};

	// Field change handlers with real-time validation
	const handleTitleChange = (value: string) => {
		setFormData((prev) => ({ ...prev, title: value }));
		const error = validateTitle(value);
		setValidationErrors((prev) => ({ ...prev, title: error }));
	};

	const handleStartDateChange = (value: string) => {
		setFormData((prev) => ({ ...prev, startDate: value }));
		const errors = validateDates(value, formData.dueDate);
		setValidationErrors((prev) => ({ ...prev, ...errors }));
	};

	const handleDueDateChange = (value: string) => {
		setFormData((prev) => ({ ...prev, dueDate: value }));
		const errors = validateDates(formData.startDate, value);
		setValidationErrors((prev) => ({ ...prev, ...errors }));
	};

	const handleUrlChange = (value: string) => {
		setFormData((prev) => ({ ...prev, url: value }));
		const error = validateUrl(value);
		setValidationErrors((prev) => ({ ...prev, url: error }));
	};

	// Attendee handlers
	const addAttendee = () => {
		setFormData((prev) => ({
			...prev,
			attendees: [...(prev.attendees || []), { email: "", rsvp: false }],
		}));
	};

	const removeAttendee = (index: number) => {
		setFormData((prev) => ({
			...prev,
			attendees: prev.attendees?.filter((_, i) => i !== index) || [],
		}));
		setAttendeeErrors((prev) => {
			const next = { ...prev };
			delete next[index];
			return next;
		});
	};

	const updateAttendee = (index: number, data: Partial<AttendeeData>) => {
		setFormData((prev) => ({
			...prev,
			attendees:
				prev.attendees?.map((a, i) => (i === index ? { ...a, ...data } : a)) ||
				[],
		}));
	};

	// Alarm handlers
	const addAlarm = () => {
		setFormData((prev) => ({
			...prev,
			alarms: [
				...(prev.alarms || []),
				{ trigger: "-PT15M", action: "DISPLAY" },
			],
		}));
	};

	const removeAlarm = (index: number) => {
		setFormData((prev) => ({
			...prev,
			alarms: prev.alarms?.filter((_, i) => i !== index) || [],
		}));
	};

	const updateAlarm = (index: number, data: Partial<AlarmData>) => {
		setFormData((prev) => ({
			...prev,
			alarms:
				prev.alarms?.map((a, i) => (i === index ? { ...a, ...data } : a)) || [],
		}));
	};

	// Attachment handlers
	const addAttachment = () => {
		setFormData((prev) => ({
			...prev,
			attachments: [...(prev.attachments || []), { uri: "" }],
		}));
	};

	const removeAttachment = (index: number) => {
		setFormData((prev) => ({
			...prev,
			attachments: prev.attachments?.filter((_, i) => i !== index) || [],
		}));
	};

	const updateAttachment = (index: number, data: Partial<AttachmentData>) => {
		setFormData((prev) => ({
			...prev,
			attachments:
				prev.attachments?.map((a, i) =>
					i === index ? { ...a, ...data } : a,
				) || [],
		}));
	};

	// Form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const errors = validateTaskForm(formData);

		if (hasValidationErrors(errors)) {
			setValidationErrors(errors);
			const firstError = Object.values(errors).find(
				(e): e is string => typeof e === "string",
			);
			if (firstError) {
				toast.error(firstError);
			}
			return;
		}

		setValidationErrors({});
		resetTracking();
		onSubmit(formData);
	};

	const totalSections = 7;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<CardTitle className="flex items-center gap-2">
							{mode === "create" ? "Create a task" : "Edit task"}
							{hasModifications && mode === "edit" && (
								<Badge variant="outline" className="text-xs">
									Unsaved changes
								</Badge>
							)}
						</CardTitle>
						<CardDescription>
							Fill in your task information. Fields marked with an asterisk (*)
							are required.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			{/* Mobile progress indicator */}
			{isMobile && (
				<MobileFormProgress
					currentSection={currentSection}
					totalSections={totalSections}
					className="sticky top-0 z-10"
				/>
			)}

			<CardContent>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
					{/* Section 1: Basic Info */}
					<div ref={setSectionRef("basic")} data-section-id="basic">
						<CollapsibleSection
							id="basic"
							title="Basic Information"
							isExpanded={expandedSections.has("basic")}
							onToggle={() => toggleSection("basic")}
							icon={FileText}
						>
							<BasicInfoSection
								title={formData.title}
								description={formData.description || ""}
								status={formData.status}
								priority={String(formData.priority || 0)}
								percentComplete={formData.percentComplete}
								onTitleChange={handleTitleChange}
								onDescriptionChange={(v) =>
									setFormData((p) => ({ ...p, description: v }))
								}
								onStatusChange={(v) =>
									setFormData((p) => ({
										...p,
										status: v as TaskFormData["status"],
									}))
								}
								onPriorityChange={(v) =>
									setFormData((p) => ({ ...p, priority: Number(v) }))
								}
								onPercentCompleteChange={(v) =>
									setFormData((p) => ({ ...p, percentComplete: v }))
								}
								validationErrors={{ title: validationErrors["title"] }}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 2: Dates */}
					<div ref={setSectionRef("dates")} data-section-id="dates">
						<CollapsibleSection
							id="dates"
							title="Dates"
							description="Start and due dates"
							isExpanded={expandedSections.has("dates")}
							onToggle={() => toggleSection("dates")}
							icon={Calendar}
						>
							<DatesSection
								startDate={formData.startDate || ""}
								startTime={startTime}
								dueDate={formData.dueDate || ""}
								dueTime={dueTime}
								onStartDateChange={handleStartDateChange}
								onStartTimeChange={setStartTime}
								onDueDateChange={handleDueDateChange}
								onDueTimeChange={setDueTime}
								validationErrors={{
									startDate: validationErrors["startDate"],
									dueDate: validationErrors["dueDate"],
								}}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 3: Attendees */}
					<div ref={setSectionRef("attendees")} data-section-id="attendees">
						<CollapsibleSection
							id="attendees"
							title="Attendees"
							description="Assign people to this task"
							isExpanded={expandedSections.has("attendees")}
							onToggle={() => toggleSection("attendees")}
							icon={Users}
							badge={formData.attendees?.length || undefined}
						>
							<AttendeesSection
								attendees={formData.attendees || []}
								onAddAttendee={addAttendee}
								onRemoveAttendee={removeAttendee}
								onUpdateAttendee={updateAttendee}
								validationErrors={attendeeErrors}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 4: Alarms */}
					<div ref={setSectionRef("alarms")} data-section-id="alarms">
						<CollapsibleSection
							id="alarms"
							title="Reminders"
							description="Get notified about this task"
							isExpanded={expandedSections.has("alarms")}
							onToggle={() => toggleSection("alarms")}
							icon={Bell}
							badge={formData.alarms?.length || undefined}
						>
							<AlarmsSection
								alarms={formData.alarms || []}
								onAddAlarm={addAlarm}
								onRemoveAlarm={removeAlarm}
								onUpdateAlarm={updateAlarm}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 5: Recurrence */}
					<div ref={setSectionRef("recurrence")} data-section-id="recurrence">
						<CollapsibleSection
							id="recurrence"
							title="Recurrence"
							description="Make this a repeating task"
							isExpanded={expandedSections.has("recurrence")}
							onToggle={() => toggleSection("recurrence")}
							icon={Repeat}
						>
							<RecurrenceSection
								rrule={formData.rrule || ""}
								onRruleChange={(v) => setFormData((p) => ({ ...p, rrule: v }))}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 6: Attachments */}
					<div ref={setSectionRef("attachments")} data-section-id="attachments">
						<CollapsibleSection
							id="attachments"
							title="Attachments"
							description="Add files and links"
							isExpanded={expandedSections.has("attachments")}
							onToggle={() => toggleSection("attachments")}
							icon={Paperclip}
							badge={formData.attachments?.length || undefined}
						>
							<AttachmentsSection
								attachments={formData.attachments || []}
								onAddAttachment={addAttachment}
								onRemoveAttachment={removeAttachment}
								onUpdateAttachment={updateAttachment}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Section 7: Additional Info */}
					<div ref={setSectionRef("additional")} data-section-id="additional">
						<CollapsibleSection
							id="additional"
							title="Additional Details"
							description="Location, URL, categories, color"
							isExpanded={expandedSections.has("additional")}
							onToggle={() => toggleSection("additional")}
							icon={Settings}
						>
							<AdditionalInfoSection
								location={formData.location || ""}
								url={formData.url || ""}
								categories={formData.categories || ""}
								color={formData.color || "#22c55e"}
								onLocationChange={(v) =>
									setFormData((p) => ({ ...p, location: v }))
								}
								onUrlChange={handleUrlChange}
								onCategoriesChange={(v) =>
									setFormData((p) => ({ ...p, categories: v }))
								}
								onColorChange={(v) => setFormData((p) => ({ ...p, color: v }))}
								validationErrors={{ url: validationErrors["url"] }}
								isSubmitting={isSubmitting}
							/>
						</CollapsibleSection>
					</div>

					{/* Sticky action buttons on mobile */}
					<div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t bg-card/95 p-4 backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:bg-transparent sm:pt-4 sm:backdrop-blur-0">
						<div className="flex gap-2">
							<Button
								type="submit"
								disabled={!formData.title.trim() || isSubmitting}
								className="min-h-[44px] flex-1 sm:min-h-0"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{mode === "create" ? "Creating..." : "Saving..."}
									</>
								) : mode === "create" ? (
									<>
										<FileText className="mr-2 h-4 w-4" />
										Create Task
									</>
								) : (
									<>
										<FileText className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
								disabled={isSubmitting}
								className="min-h-[44px] sm:min-h-0"
							>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
