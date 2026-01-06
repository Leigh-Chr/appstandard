/**
 * Extended task form component for full-page create/edit
 * Based on EventFormExtended pattern from Calendar app
 */

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Progress,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@appstandard/ui";
import { format } from "date-fns";
import {
	Calendar,
	ChevronDown,
	ChevronUp,
	Clock,
	Flag,
	Loader2,
	MapPin,
	Percent,
	Tag,
} from "lucide-react";
import { useState } from "react";

export interface TaskFormData {
	title: string;
	description?: string | undefined;
	status: "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED";
	priority?: number | undefined;
	percentComplete: number;
	dueDate?: Date | undefined;
	startDate?: Date | undefined;
	location?: string | undefined;
	url?: string | undefined;
	categories?: string | undefined;
	color?: string | undefined;
}

interface TaskFormExtendedProps {
	mode: "create" | "edit";
	initialData?: Partial<TaskFormData> | undefined;
	onSubmit: (data: TaskFormData) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	taskListId: string;
}

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

export function TaskFormExtended({
	mode,
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: TaskFormExtendedProps) {
	// Form state
	const [title, setTitle] = useState(initialData?.title || "");
	const [description, setDescription] = useState(
		initialData?.description || "",
	);
	const [status, setStatus] = useState<TaskFormData["status"]>(
		initialData?.status || "NEEDS_ACTION",
	);
	const [priority, setPriority] = useState<string>(
		String(initialData?.priority || 0),
	);
	const [percentComplete, setPercentComplete] = useState(
		initialData?.percentComplete || 0,
	);
	const [dueDate, setDueDate] = useState(
		initialData?.dueDate
			? format(new Date(initialData.dueDate), "yyyy-MM-dd")
			: "",
	);
	const [dueTime, setDueTime] = useState(
		initialData?.dueDate ? format(new Date(initialData.dueDate), "HH:mm") : "",
	);
	const [startDate, setStartDate] = useState(
		initialData?.startDate
			? format(new Date(initialData.startDate), "yyyy-MM-dd")
			: "",
	);
	const [startTime, setStartTime] = useState(
		initialData?.startDate
			? format(new Date(initialData.startDate), "HH:mm")
			: "",
	);
	const [location, setLocation] = useState(initialData?.location || "");
	const [url, setUrl] = useState(initialData?.url || "");
	const [categories, setCategories] = useState(initialData?.categories || "");
	const [color, setColor] = useState(initialData?.color || "#22c55e");

	// Section visibility state
	const [showDatesSection, setShowDatesSection] = useState(
		mode === "edit" || Boolean(initialData?.dueDate || initialData?.startDate),
	);
	const [showDetailsSection, setShowDetailsSection] = useState(
		mode === "edit" ||
			Boolean(
				initialData?.location ||
					initialData?.url ||
					initialData?.categories ||
					initialData?.color,
			),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		let parsedDueDate: Date | undefined;
		let parsedStartDate: Date | undefined;

		if (dueDate) {
			parsedDueDate = new Date(dueDate);
			if (dueTime) {
				const parts = dueTime.split(":").map(Number);
				const hours = parts[0] ?? 0;
				const minutes = parts[1] ?? 0;
				parsedDueDate.setHours(hours, minutes);
			}
		}

		if (startDate) {
			parsedStartDate = new Date(startDate);
			if (startTime) {
				const parts = startTime.split(":").map(Number);
				const hours = parts[0] ?? 0;
				const minutes = parts[1] ?? 0;
				parsedStartDate.setHours(hours, minutes);
			}
		}

		onSubmit({
			title,
			description: description || undefined,
			status,
			priority: Number.parseInt(priority, 10) || undefined,
			percentComplete,
			dueDate: parsedDueDate,
			startDate: parsedStartDate,
			location: location || undefined,
			url: url || undefined,
			categories: categories || undefined,
			color: color || undefined,
		});
	};

	const statusInfo = STATUS_OPTIONS.find((s) => s.value === status);

	// Calculate expanded sections for mobile progress indicator
	const totalSections = 3; // Basic Info, Dates, Details
	const expandedSections =
		1 + (showDatesSection ? 1 : 0) + (showDetailsSection ? 1 : 0);

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Mobile Progress Indicator */}
			<div className="flex items-center justify-between text-muted-foreground text-sm sm:hidden">
				<span>
					Section {expandedSections} of {totalSections}
				</span>
				<span>
					{Math.round((expandedSections / totalSections) * 100)}% complete
				</span>
			</div>

			{/* Basic Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						Basic Information
						{statusInfo && (
							<Badge variant="outline" className="ml-2">
								<span
									className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusInfo.color}`}
								/>
								{statusInfo.label}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Task title"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add a description..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={status}
								onValueChange={(v) => setStatus(v as TaskFormData["status"])}
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
							<Select value={priority} onValueChange={setPriority}>
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

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="percentComplete">
								Progress: {percentComplete}%
							</Label>
							<span className="text-muted-foreground text-sm">
								<Percent className="inline h-3 w-3" />
							</span>
						</div>
						<Progress value={percentComplete} className="h-2" />
						<input
							type="range"
							id="percentComplete"
							min="0"
							max="100"
							step="5"
							value={percentComplete}
							onChange={(e) => setPercentComplete(Number(e.target.value))}
							className="w-full"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Dates Section - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowDatesSection(!showDatesSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Dates
						</span>
						{showDatesSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showDatesSection && (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="startDate" className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Start Date
								</Label>
								<Input
									id="startDate"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="startTime" className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Start Time
								</Label>
								<Input
									id="startTime"
									type="time"
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									disabled={!startDate}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="dueDate" className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-destructive" />
									Due Date
								</Label>
								<Input
									id="dueDate"
									type="date"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="dueTime" className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-destructive" />
									Due Time
								</Label>
								<Input
									id="dueTime"
									type="time"
									value={dueTime}
									onChange={(e) => setDueTime(e.target.value)}
									disabled={!dueDate}
								/>
							</div>
						</div>

						{dueDate && (
							<div className="rounded-lg border bg-muted/50 p-3">
								<p className="text-sm">
									Due:{" "}
									<span className="font-medium">
										{format(new Date(dueDate), "EEEE, MMMM d, yyyy")}
										{dueTime && ` at ${dueTime}`}
									</span>
								</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>

			{/* Details Section - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer"
					onClick={() => setShowDetailsSection(!showDetailsSection)}
				>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<Tag className="h-5 w-5" />
							Additional Details
						</span>
						{showDetailsSection ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</CardTitle>
				</CardHeader>
				{showDetailsSection && (
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="location" className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								Location
							</Label>
							<Input
								id="location"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="Add a location..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="url">URL</Label>
							<Input
								id="url"
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="categories" className="flex items-center gap-2">
								<Tag className="h-4 w-4" />
								Categories
							</Label>
							<Input
								id="categories"
								value={categories}
								onChange={(e) => setCategories(e.target.value)}
								placeholder="work, personal, urgent (comma-separated)"
							/>
							{categories && (
								<div className="flex flex-wrap gap-1">
									{categories.split(",").map((cat) => (
										<Badge key={cat.trim()} variant="secondary">
											{cat.trim()}
										</Badge>
									))}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<div className="flex items-center gap-2">
								<input
									id="color"
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									className="h-10 w-20 cursor-pointer rounded border"
								/>
								<span className="text-muted-foreground text-sm">{color}</span>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || !title.trim()}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{mode === "create" ? "Create Task" : "Save Changes"}
				</Button>
			</div>
		</form>
	);
}
