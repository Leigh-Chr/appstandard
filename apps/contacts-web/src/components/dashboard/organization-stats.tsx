import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { Building2 } from "lucide-react";

interface OrganizationStatsProps {
	organizations: {
		name: string;
		count: number;
	}[];
}

export function OrganizationStats({ organizations }: OrganizationStatsProps) {
	if (organizations.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Building2 className="h-4 w-4" />
						Top Organizations
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No organization data
					</p>
				</CardContent>
			</Card>
		);
	}

	const maxCount = Math.max(...organizations.map((org) => org.count));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Building2 className="h-4 w-4" />
					Top Organizations
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{organizations.slice(0, 5).map((org, index) => {
						const percentage = (org.count / maxCount) * 100;
						return (
							<div key={org.name} className="space-y-1">
								<div className="flex items-center justify-between text-sm">
									<span className="truncate font-medium">
										{index + 1}. {org.name}
									</span>
									<span className="ml-2 text-muted-foreground">
										{org.count} contacts
									</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-primary transition-all"
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
