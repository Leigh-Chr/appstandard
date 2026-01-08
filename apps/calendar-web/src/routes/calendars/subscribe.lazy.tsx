import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, Loader2, Rss } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/calendars/subscribe")({
	component: SubscribeCalendarComponent,
});

/**
 * Decode a webcal URL from the protocol handler
 * Handles both web+webcal: and webcal: protocols
 */
function decodeWebcalUrl(encodedUrl: string | undefined): string {
	if (!encodedUrl) return "";

	try {
		// URL might be encoded
		const decoded = decodeURIComponent(encodedUrl);

		// Remove web+ prefix if present (from protocol handler)
		let url = decoded.replace(/^web\+/, "");

		// Convert webcal:// to https://
		url = url.replace(/^webcal:\/\//, "https://");

		// Handle ical: protocol
		url = url.replace(/^ical:\/\//, "https://");

		return url;
	} catch {
		return encodedUrl;
	}
}

function SubscribeCalendarComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { url: urlParam } = Route.useSearch();

	// Decode the URL from protocol handler
	const decodedUrl = decodeWebcalUrl(urlParam);

	const [url, setUrl] = useState(decodedUrl);
	const [calendarName, setCalendarName] = useState("");

	// Update local state when URL param changes
	useEffect(() => {
		if (decodedUrl) {
			setUrl(decodedUrl);
		}
	}, [decodedUrl]);

	const importFromUrlMutation = useMutation(
		trpc.calendar.importFromUrl.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});

				toast.success(
					`Subscribed! ${data.importedEvents} events imported from the calendar.`,
				);
				navigate({ to: `/calendars/${data.calendar.id}` });
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error
						? error.message
						: "Error subscribing to calendar";
				toast.error(message);
			},
		}),
	);

	const handleSubscribe = () => {
		if (!url.trim()) {
			toast.error("Please enter a calendar URL");
			return;
		}

		importFromUrlMutation.mutate({
			url: url.trim(),
			name: calendarName || undefined,
		});
	};

	const isPending = importFromUrlMutation.isPending;

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="transition-all duration-200 hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Rss className="h-5 w-5" />
							Subscribe to a calendar
						</CardTitle>
						<CardDescription>
							Subscribe to a webcal:// or ICS calendar URL. The calendar will be
							imported and you can refresh it later to get updates.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Auto-filled notification */}
						{urlParam && (
							<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
								<p className="flex items-center gap-2 text-primary text-sm">
									<Globe className="h-4 w-4" />
									Calendar URL detected from your link
								</p>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="url">Calendar URL</Label>
							<Input
								id="url"
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://calendar.google.com/calendar/ical/..."
								disabled={isPending}
							/>
							<p className="text-muted-foreground text-xs">
								Paste the public URL of the calendar (webcal:// or https://)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Calendar name (optional)</Label>
							<Input
								id="name"
								value={calendarName}
								onChange={(e) => setCalendarName(e.target.value)}
								placeholder="My subscribed calendar"
								disabled={isPending}
							/>
							<p className="text-muted-foreground text-xs">
								Leave empty to use the calendar's name
							</p>
						</div>

						{/* Help text */}
						<div className="rounded-lg bg-muted/50 p-4 text-sm">
							<p className="mb-2 font-medium">Supported URL formats</p>
							<ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
								<li>
									<strong>webcal://</strong> - Standard calendar subscription
									protocol
								</li>
								<li>
									<strong>https://.../*.ics</strong> - Direct ICS file URL
								</li>
								<li>
									<strong>Google Calendar</strong> - Public calendar ICS URL
								</li>
								<li>
									<strong>Apple iCloud</strong> - Public calendar link
								</li>
							</ul>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={handleSubscribe}
								disabled={!url.trim() || isPending}
								className="interactive-glow flex-1"
							>
								{isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Subscribing...
									</>
								) : (
									<>
										<Rss className="mr-2 h-4 w-4" />
										Subscribe
									</>
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/calendars" })}
								disabled={isPending}
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
