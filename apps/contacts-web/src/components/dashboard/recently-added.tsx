import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@appstandard/ui";
import { Clock, User } from "lucide-react";

interface RecentContact {
	id: string;
	name: string;
	email: string | null;
	addressBookName: string;
	createdAt: string;
}

interface RecentlyAddedProps {
	contacts: RecentContact[];
}

function formatRelativeTime(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 60) {
		return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

export function RecentlyAdded({ contacts }: RecentlyAddedProps) {
	if (contacts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Clock className="h-4 w-4" />
						Recently Added
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No recent contacts
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Clock className="h-4 w-4" />
					Recently Added
					<Badge variant="secondary" className="ml-auto">
						{contacts.length}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{contacts.slice(0, 5).map((contact) => (
						<div
							key={contact.id}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
									<User className="h-4 w-4 text-primary" />
								</div>
								<div>
									<p className="font-medium text-sm">{contact.name}</p>
									<p className="text-muted-foreground text-xs">
										{contact.email || contact.addressBookName}
									</p>
								</div>
							</div>
							<p className="text-muted-foreground text-xs">
								{formatRelativeTime(contact.createdAt)}
							</p>
						</div>
					))}
					{contacts.length > 5 && (
						<p className="text-center text-muted-foreground text-xs">
							+{contacts.length - 5} more contacts
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
