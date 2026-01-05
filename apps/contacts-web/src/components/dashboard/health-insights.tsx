import { cn } from "@appstandard/react-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { AlertTriangle, CheckCircle2, Copy, Mail, Phone } from "lucide-react";

interface HealthInsightsProps {
	health: {
		withoutEmail: number;
		withoutPhone: number;
		potentialDuplicates: number;
		emptyAddressBooks: number;
	};
}

export function HealthInsights({ health }: HealthInsightsProps) {
	const insights = [
		{
			label: "Without Email",
			count: health.withoutEmail,
			icon: Mail,
			severity: health.withoutEmail > 10 ? "warning" : "info",
			description: "Contacts missing email addresses",
		},
		{
			label: "Without Phone",
			count: health.withoutPhone,
			icon: Phone,
			severity: health.withoutPhone > 10 ? "warning" : "info",
			description: "Contacts missing phone numbers",
		},
		{
			label: "Potential Duplicates",
			count: health.potentialDuplicates,
			icon: Copy,
			severity: health.potentialDuplicates > 0 ? "warning" : "success",
			description: "Possible duplicate contacts detected",
		},
		{
			label: "Empty Address Books",
			count: health.emptyAddressBooks,
			icon: AlertTriangle,
			severity: health.emptyAddressBooks > 0 ? "warning" : "success",
			description: "Address books with no contacts",
		},
	];

	const hasIssues = insights.some(
		(i) => i.severity === "warning" && i.count > 0,
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					{hasIssues ? (
						<AlertTriangle className="h-4 w-4 text-amber-500" />
					) : (
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					)}
					Data Health
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{insights.map((insight) => {
						const Icon = insight.icon;
						const isWarning =
							insight.severity === "warning" && insight.count > 0;
						const isSuccess = insight.count === 0;

						return (
							<div
								key={insight.label}
								className={cn(
									"flex items-center justify-between rounded-lg p-3",
									isWarning
										? "bg-amber-500/10"
										: isSuccess
											? "bg-emerald-500/10"
											: "bg-muted/50",
								)}
							>
								<div className="flex items-center gap-3">
									<Icon
										className={cn(
											"h-4 w-4",
											isWarning
												? "text-amber-600 dark:text-amber-400"
												: isSuccess
													? "text-emerald-600 dark:text-emerald-400"
													: "text-muted-foreground",
										)}
									/>
									<div>
										<p
											className={cn(
												"font-medium text-sm",
												isWarning
													? "text-amber-600 dark:text-amber-400"
													: isSuccess
														? "text-emerald-600 dark:text-emerald-400"
														: "",
											)}
										>
											{insight.label}
										</p>
										<p className="text-muted-foreground text-xs">
											{insight.description}
										</p>
									</div>
								</div>
								<span
									className={cn(
										"font-bold text-lg",
										isWarning
											? "text-amber-600 dark:text-amber-400"
											: isSuccess
												? "text-emerald-600 dark:text-emerald-400"
												: "",
									)}
								>
									{insight.count}
								</span>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
