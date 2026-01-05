import { cn } from "@appstandard/react-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { CheckCircle2 } from "lucide-react";

interface CompletenessChartProps {
	completeness: {
		withEmail: number;
		withPhone: number;
		withAddress: number;
		withPhoto: number;
		total: number;
	};
}

export function CompletenessChart({ completeness }: CompletenessChartProps) {
	const { withEmail, withPhone, withAddress, withPhoto, total } = completeness;

	if (total === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<CheckCircle2 className="h-4 w-4" />
						Contact Completeness
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No contacts to analyze
					</p>
				</CardContent>
			</Card>
		);
	}

	const fields = [
		{
			label: "Email",
			count: withEmail,
			percentage: Math.round((withEmail / total) * 100),
			color: "bg-blue-500",
		},
		{
			label: "Phone",
			count: withPhone,
			percentage: Math.round((withPhone / total) * 100),
			color: "bg-emerald-500",
		},
		{
			label: "Address",
			count: withAddress,
			percentage: Math.round((withAddress / total) * 100),
			color: "bg-purple-500",
		},
		{
			label: "Photo",
			count: withPhoto,
			percentage: Math.round((withPhoto / total) * 100),
			color: "bg-amber-500",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<CheckCircle2 className="h-4 w-4" />
					Contact Completeness
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{fields.map((field) => (
						<div key={field.label} className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">{field.label}</span>
								<span className="text-muted-foreground">
									{field.count}/{total} ({field.percentage}%)
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-muted">
								<div
									className={cn(
										"h-full rounded-full transition-all",
										field.color,
									)}
									style={{ width: `${field.percentage}%` }}
								/>
							</div>
						</div>
					))}
				</div>

				{/* Overall score */}
				<div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
					<p className="text-muted-foreground text-xs">Average Completeness</p>
					<p className="font-bold text-2xl">
						{Math.round(
							fields.reduce((sum, f) => sum + f.percentage, 0) / fields.length,
						)}
						%
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
