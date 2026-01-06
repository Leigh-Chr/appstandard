/**
 * Attendees section for task form
 * Add/remove attendees with email, name, role, status
 */

import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { Plus, Trash2 } from "lucide-react";

interface AttendeeData {
	email: string;
	name?: string;
	role?: string;
	status?: string;
	rsvp?: boolean;
}

const ROLE_OPTIONS = [
	{ value: "REQ-PARTICIPANT", label: "Required" },
	{ value: "OPT-PARTICIPANT", label: "Optional" },
	{ value: "CHAIR", label: "Chair" },
	{ value: "NON-PARTICIPANT", label: "Non-participant" },
] as const;

const STATUS_OPTIONS = [
	{ value: "NEEDS-ACTION", label: "Needs Action" },
	{ value: "ACCEPTED", label: "Accepted" },
	{ value: "DECLINED", label: "Declined" },
	{ value: "TENTATIVE", label: "Tentative" },
	{ value: "IN-PROCESS", label: "In Progress" },
	{ value: "COMPLETED", label: "Completed" },
] as const;

interface AttendeesSectionProps {
	attendees: AttendeeData[];
	onAddAttendee: () => void;
	onRemoveAttendee: (index: number) => void;
	onUpdateAttendee: (index: number, data: Partial<AttendeeData>) => void;
	validationErrors?: Record<number, string>;
	isSubmitting: boolean;
}

export function AttendeesSection({
	attendees,
	onAddAttendee,
	onRemoveAttendee,
	onUpdateAttendee,
	validationErrors,
	isSubmitting,
}: AttendeesSectionProps) {
	return (
		<div className="space-y-4">
			{attendees.length === 0 ? (
				<p className="text-muted-foreground text-sm">No attendees added yet.</p>
			) : (
				<div className="space-y-4">
					{attendees.map((attendee, index) => (
						<div
							key={index}
							className="relative space-y-3 rounded-lg border bg-card p-4"
						>
							{/* Remove button */}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onRemoveAttendee(index)}
								disabled={isSubmitting}
								className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>

							{/* Email (required) */}
							<div className="space-y-2 pr-10">
								<Label htmlFor={`attendee-email-${index}`}>Email *</Label>
								<Input
									id={`attendee-email-${index}`}
									type="email"
									value={attendee.email}
									onChange={(e) =>
										onUpdateAttendee(index, { email: e.target.value })
									}
									placeholder="email@example.com"
									disabled={isSubmitting}
									className={
										validationErrors?.[index] ? "border-destructive" : ""
									}
								/>
								{validationErrors?.[index] && (
									<p className="text-destructive text-sm">
										{validationErrors[index]}
									</p>
								)}
							</div>

							{/* Name (optional) */}
							<div className="space-y-2">
								<Label htmlFor={`attendee-name-${index}`}>Name</Label>
								<Input
									id={`attendee-name-${index}`}
									value={attendee.name || ""}
									onChange={(e) =>
										onUpdateAttendee(index, { name: e.target.value })
									}
									placeholder="John Doe"
									disabled={isSubmitting}
								/>
							</div>

							{/* Role and Status */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label htmlFor={`attendee-role-${index}`}>Role</Label>
									<Select
										value={attendee.role || "REQ-PARTICIPANT"}
										onValueChange={(value) =>
											onUpdateAttendee(index, { role: value })
										}
										disabled={isSubmitting}
									>
										<SelectTrigger id={`attendee-role-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ROLE_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`attendee-status-${index}`}>Status</Label>
									<Select
										value={attendee.status || "NEEDS-ACTION"}
										onValueChange={(value) =>
											onUpdateAttendee(index, { status: value })
										}
										disabled={isSubmitting}
									>
										<SelectTrigger id={`attendee-status-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STATUS_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add button */}
			<Button
				type="button"
				variant="outline"
				onClick={onAddAttendee}
				disabled={isSubmitting}
				className="w-full"
			>
				<Plus className="mr-2 h-4 w-4" />
				Add Attendee
			</Button>
		</div>
	);
}
