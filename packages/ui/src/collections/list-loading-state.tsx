/**
 * Generic loading state component for entity lists
 * Used by Calendar, Contacts, and Tasks apps
 */

import { Card, CardContent, CardHeader } from "../card";
import { Skeleton } from "../skeleton";

export interface ListLoadingStateProps {
	/** Number of skeleton cards to show */
	cardCount?: number | undefined;
}

export function ListLoadingState({ cardCount = 3 }: ListLoadingStateProps) {
	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>
			<div className="container mx-auto max-w-5xl px-4 py-10">
				<div className="mb-6 flex items-center justify-between">
					<Skeleton className="h-9 w-48" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-40" />
						<Skeleton className="h-10 w-28" />
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: cardCount }, (_, i) => (
						<Card key={i} className="shimmer">
							<CardHeader className="pb-3">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-9 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
