import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { Link2, Package, Users } from "lucide-react";

interface SharingStatsProps {
	sharing: {
		activeLinks: number;
		totalBundles: number;
		sharedGroups: number;
	};
}

export function SharingStats({ sharing }: SharingStatsProps) {
	const stats = [
		{
			label: "Active Share Links",
			value: sharing.activeLinks,
			icon: Link2,
			description: "Direct links to address books",
		},
		{
			label: "Share Bundles",
			value: sharing.totalBundles,
			icon: Package,
			description: "Combined address book shares",
		},
		{
			label: "Shared Groups",
			value: sharing.sharedGroups,
			icon: Users,
			description: "Collaborative groups",
		},
	];

	const hasSharing = stats.some((s) => s.value > 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Link2 className="h-4 w-4" />
					Sharing Overview
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasSharing ? (
					<div className="grid grid-cols-3 gap-3">
						{stats.map((stat) => {
							const Icon = stat.icon;
							return (
								<div
									key={stat.label}
									className="rounded-lg bg-muted/50 p-3 text-center"
								>
									<Icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
									<p className="font-bold text-2xl">{stat.value}</p>
									<p className="text-muted-foreground text-xs">{stat.label}</p>
								</div>
							);
						})}
					</div>
				) : (
					<p className="text-center text-muted-foreground text-sm">
						No active shares. Share address books to collaborate with others.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
