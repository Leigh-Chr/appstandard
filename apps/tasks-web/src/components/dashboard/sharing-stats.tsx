import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { Link2, Package, Share2, Users } from "lucide-react";

interface SharingStatsProps {
	sharing: {
		activeLinks: number;
		activeBundles: number;
		sharedGroups: number;
		pendingInvitations: number;
	};
}

export function SharingStats({ sharing }: SharingStatsProps) {
	const stats = [
		{
			label: "Active share links",
			count: sharing.activeLinks,
			icon: Link2,
		},
		{
			label: "Active bundles",
			count: sharing.activeBundles,
			icon: Package,
		},
		{
			label: "Shared groups",
			count: sharing.sharedGroups,
			icon: Users,
		},
		{
			label: "Pending invitations",
			count: sharing.pendingInvitations,
			icon: Share2,
			highlight: sharing.pendingInvitations > 0,
		},
	];

	const hasSharing = stats.some((s) => s.count > 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Share2 className="h-4 w-4" />
					Sharing & Collaboration
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasSharing ? (
					<div className="grid grid-cols-2 gap-3">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className={`flex flex-col items-center rounded-lg p-3 ${
									stat.highlight ? "bg-primary/10" : "bg-muted/50"
								}`}
							>
								<stat.icon
									className={`mb-1 h-5 w-5 ${
										stat.highlight ? "text-primary" : "text-muted-foreground"
									}`}
								/>
								<span
									className={`font-bold text-lg ${
										stat.highlight ? "text-primary" : ""
									}`}
								>
									{stat.count}
								</span>
								<span className="text-center text-muted-foreground text-xs">
									{stat.label}
								</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-center text-muted-foreground text-sm">
						No active shares or collaborations
					</p>
				)}
			</CardContent>
		</Card>
	);
}
