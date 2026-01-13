import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Merge } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SearchBar } from "@/components/calendar-list/calendar-filters";
import { useCalendars } from "@/hooks/use-storage";
import { QUERY_KEYS } from "@/lib/query-keys";
import { parseSelectedIds } from "@/lib/search-params";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/calendars/merge")({
	component: MergeCalendarsComponent,
});

function MergeCalendarsComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { calendars: allCalendars } = useCalendars();
	const search = Route.useSearch();

	// Initialize from URL params
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() => new Set(parseSelectedIds(search.selected)),
	);
	const [mergedName, setMergedName] = useState("");
	const [removeDuplicates, setRemoveDuplicates] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");

	// Filter calendars by search keyword
	// React Compiler will automatically memoize this computation
	const calendars = (() => {
		// Ensure allCalendars is always an array
		const calendarsArray = Array.isArray(allCalendars) ? allCalendars : [];
		if (!searchKeyword.trim()) {
			return calendarsArray;
		}
		const searchLower = searchKeyword.trim().toLowerCase();
		return calendarsArray.filter((cal) =>
			cal.name.toLowerCase().includes(searchLower),
		);
	})();

	// Sync URL changes to local state (browser back/forward)
	useEffect(() => {
		setSelectedIds(new Set(parseSelectedIds(search.selected)));
	}, [search.selected]);

	const mergeMutation = useMutation(
		trpc.calendar.merge.mutationOptions({
			onSuccess: (data) => {
				// Merge creates a new calendar, invalidate calendar list
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendar.list,
				});
				// PERF-004: Invalidate events for the new merged calendar
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.event.list(data.calendar.id),
				});
				// Dashboard aggregates across all calendars
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(
					`Calendars merged! ${data.mergedEvents} event(s), ${data.removedDuplicates} duplicate(s) cleaned up.`,
				);
				navigate({ to: `/calendars/${data.calendar.id}` });
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during merge";
				toast.error(message);
			},
		}),
	);

	const handleToggle = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);

		// Update URL with selected IDs (as comma-separated string)
		const selectedStr = Array.from(newSet).join(",");
		navigate({
			to: ".",
			search: { selected: selectedStr || undefined },
			replace: true, // Don't add to history for each toggle
		});
	};

	const handleMerge = () => {
		if (selectedIds.size < 2) {
			toast.error("Select at least 2 calendars to merge");
			return;
		}

		if (!mergedName.trim()) {
			toast.error("Please enter a name for the merged calendar");
			return;
		}

		mergeMutation.mutate({
			calendarIds: Array.from(selectedIds),
			name: mergedName.trim(),
			removeDuplicates,
		});
	};

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
							<Merge className="h-5 w-5" />
							Merge calendars
						</CardTitle>
						<CardDescription>
							Combine multiple calendars into one
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Select calendars to merge (minimum 2)</Label>
							{allCalendars && allCalendars.length > 3 && (
								<div className="mb-2">
									<SearchBar
										keyword={searchKeyword}
										onKeywordChange={setSearchKeyword}
										placeholder="Search calendars by name..."
										ariaLabel="Search calendars to merge"
									/>
								</div>
							)}
							<div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
								{!allCalendars || allCalendars.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No calendars available
									</p>
								) : calendars.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No calendars match your search
									</p>
								) : (
									calendars.map((calendar) => (
										<div
											key={calendar.id}
											className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent"
										>
											<Checkbox
												id={calendar.id}
												checked={selectedIds.has(calendar.id)}
												onCheckedChange={() => handleToggle(calendar.id)}
											/>
											<Label
												htmlFor={calendar.id}
												className="flex-1 cursor-pointer font-normal text-sm"
											>
												{calendar.name} ({calendar.eventCount} event
												{calendar.eventCount !== 1 ? "s" : ""})
											</Label>
										</div>
									))
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mergedName">Merged calendar name</Label>
							<Input
								id="mergedName"
								value={mergedName}
								onChange={(e) => setMergedName(e.target.value)}
								placeholder="Merged calendar"
								disabled={mergeMutation.isPending}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="removeDuplicates"
								checked={removeDuplicates}
								onCheckedChange={(checked) => {
									setRemoveDuplicates(checked === true);
								}}
								disabled={mergeMutation.isPending}
							/>
							<Label
								htmlFor="removeDuplicates"
								className="cursor-pointer font-normal text-sm"
							>
								Remove duplicates (same title + same times)
							</Label>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={handleMerge}
								disabled={
									selectedIds.size < 2 ||
									!mergedName.trim() ||
									mergeMutation.isPending
								}
								className="interactive-glow flex-1"
							>
								{mergeMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Merging...
									</>
								) : (
									"Merge"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/calendars" })}
								disabled={mergeMutation.isPending}
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
