/**
 * Basic info section for task form
 * Title, description, status, priority, progress
 */

import {
	Badge,
	Input,
	Label,
	Progress,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Textarea,
} from "@appstandard/ui";
import { Flag, Percent } from "lucide-react";

const STATUS_OPTIONS = [
	{ value: "NEEDS_ACTION", label: "To Do", color: "bg-yellow-500" },
	{ value: "IN_PROCESS", label: "In Progress", color: "bg-blue-500" },
	{ value: "COMPLETED", label: "Completed", color: "bg-green-500" },
	{ value: "CANCELLED", label: "Cancelled", color: "bg-gray-500" },
] as const;

const PRIORITY_OPTIONS = [
	{ value: "0", label: "None" },
	{ value: "1", label: "Highest (1)" },
	{ value: "2", label: "High (2)" },
	{ value: "3", label: "High (3)" },
	{ value: "4", label: "Medium-High (4)" },
	{ value: "5", label: "Medium (5)" },
	{ value: "6", label: "Medium-Low (6)" },
	{ value: "7", label: "Low (7)" },
	{ value: "8", label: "Low (8)" },
	{ value: "9", label: "Lowest (9)" },
] as const;

interface BasicInfoSectionProps {
	title: string;
	description: string;
	status: string;
	priority: string;
	percentComplete: number;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onStatusChange: (value: string) => void;
	onPriorityChange: (value: string) => void;
	onPercentCompleteChange: (value: number) => void;
	validationErrors?: { title?: string };
	isSubmitting: boolean;
}

export function BasicInfoSection({
	title,
	description,
	status,
	priority,
	percentComplete,
	onTitleChange,
	onDescriptionChange,
	onStatusChange,
	onPriorityChange,
	onPercentCompleteChange,
	validationErrors,
	isSubmitting,
}: BasicInfoSectionProps) {
	const statusInfo = STATUS_OPTIONS.find((s) => s.value === status);

	return (
		<div className="space-y-4">
			{/* Status badge */}
			{statusInfo && (
				<div className="flex items-center gap-2">
					<Badge variant="outline">
						<span
							className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusInfo.color}`}
						/>
						{statusInfo.label}
					</Badge>
				</div>
			)}

			{/* Title */}
			<div className="space-y-2">
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Task title"
					disabled={isSubmitting}
					className={validationErrors?.title ? "border-destructive" : ""}
				/>
				{validationErrors?.title && (
					<p className="text-destructive text-sm">{validationErrors.title}</p>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Add a description..."
					rows={3}
					disabled={isSubmitting}
				/>
			</div>

			{/* Status and Priority */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="status">Status</Label>
					<Select
						value={status}
						onValueChange={onStatusChange}
						disabled={isSubmitting}
					>
						<SelectTrigger id="status">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									<span className="flex items-center gap-2">
										<span
											className={`inline-block h-2 w-2 rounded-full ${opt.color}`}
										/>
										{opt.label}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="priority">Priority</Label>
					<Select
						value={priority}
						onValueChange={onPriorityChange}
						disabled={isSubmitting}
					>
						<SelectTrigger id="priority">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PRIORITY_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									<span className="flex items-center gap-2">
										<Flag
											className={`h-3 w-3 ${
												Number(opt.value) <= 3
													? "text-red-500"
													: Number(opt.value) <= 6
														? "text-yellow-500"
														: "text-gray-400"
											}`}
										/>
										{opt.label}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="percentComplete">Progress: {percentComplete}%</Label>
					<span className="text-muted-foreground text-sm">
						<Percent className="inline h-3 w-3" />
					</span>
				</div>
				<Progress value={percentComplete} className="h-2" />
				<Slider
					id="percentComplete"
					min={0}
					max={100}
					step={5}
					value={[percentComplete ?? 0]}
					onValueChange={(values) => onPercentCompleteChange(values[0] ?? 0)}
					disabled={isSubmitting}
					className="w-full"
				/>
			</div>
		</div>
	);
}
