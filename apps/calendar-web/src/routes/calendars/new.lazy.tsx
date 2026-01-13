/**
 * PERF-001: Lazy loaded component for new calendar route
 */
import { useServerStatus } from "@appstandard/react-utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ColorPicker,
	Input,
	Label,
} from "@appstandard/ui";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateCalendar } from "@/hooks/use-storage";
import { handleTRPCError } from "@/lib/error-handler";

export const Route = createLazyFileRoute("/calendars/new")({
	component: NewCalendarComponent,
});

function NewCalendarComponent() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [color, setColor] = useState<string | null>("#3B82F6");
	const { createCalendar, isCreating } = useCreateCalendar();
	const { isOffline, isChecking } = useServerStatus();

	const handleCreate = () => {
		// Validation
		if (!name.trim()) {
			toast.error("Please enter a calendar name");
			return;
		}

		// Check server status
		if (isOffline) {
			toast.error("Backend server unavailable", {
				description:
					"Please start the backend server with 'bun run dev:server'",
				duration: 10000,
			});
			return;
		}

		// Create calendar
		createCalendar(
			{ name: name.trim(), color },
			{
				onSuccess: (calendar) => {
					toast.success("Calendar created! Start adding events.");
					navigate({ to: `/calendars/${calendar.id}` });
				},
				onError: (error) => {
					handleTRPCError(error, {
						fallbackTitle: "Error during creation",
						fallbackDescription:
							"Unable to create the calendar. Please try again.",
					});
				},
			},
		);
	};

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="card-glow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Create a new calendar
						</CardTitle>
						<CardDescription>
							Create an empty calendar to start adding events
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{isOffline && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
								<AlertCircle className="h-4 w-4" />
								<span>
									The backend server is not accessible. Check that it is
									started.
								</span>
							</div>
						)}
						{isChecking && (
							<div className="flex items-center gap-2 rounded-lg border p-3 text-muted-foreground text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Checking server connection...</span>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="name">Calendar name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="My calendar"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleCreate();
									}
								}}
								disabled={isCreating}
							/>
						</div>

						<ColorPicker
							value={color}
							onChange={setColor}
							disabled={isCreating}
							label="Calendar color"
						/>

						<div className="flex gap-2">
							<Button
								onClick={handleCreate}
								disabled={!name.trim() || isCreating}
								className="interactive-glow flex-1"
							>
								{isCreating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/calendars" })}
								disabled={isCreating}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
