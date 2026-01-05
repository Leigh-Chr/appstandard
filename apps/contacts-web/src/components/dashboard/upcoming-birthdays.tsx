import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@appstandard/ui";
import { Cake, Gift } from "lucide-react";

interface UpcomingBirthday {
	id: string;
	name: string;
	birthday: string;
	daysUntil: number;
	addressBookName: string;
}

interface UpcomingBirthdaysProps {
	birthdays: UpcomingBirthday[];
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function getDaysLabel(days: number): string {
	if (days === 0) return "Today";
	if (days === 1) return "Tomorrow";
	return `In ${days} days`;
}

export function UpcomingBirthdays({ birthdays }: UpcomingBirthdaysProps) {
	if (birthdays.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Cake className="h-4 w-4" />
						Upcoming Birthdays
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No birthdays in the next 30 days
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Cake className="h-4 w-4" />
					Upcoming Birthdays
					<Badge variant="secondary" className="ml-auto">
						{birthdays.length}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{birthdays.slice(0, 5).map((birthday) => (
						<div
							key={birthday.id}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10">
									<Gift className="h-4 w-4 text-pink-600 dark:text-pink-400" />
								</div>
								<div>
									<p className="font-medium text-sm">{birthday.name}</p>
									<p className="text-muted-foreground text-xs">
										{birthday.addressBookName}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="font-medium text-sm">
									{formatDate(birthday.birthday)}
								</p>
								<p
									className={`text-xs ${
										birthday.daysUntil === 0
											? "font-semibold text-pink-600 dark:text-pink-400"
											: "text-muted-foreground"
									}`}
								>
									{getDaysLabel(birthday.daysUntil)}
								</p>
							</div>
						</div>
					))}
					{birthdays.length > 5 && (
						<p className="text-center text-muted-foreground text-xs">
							+{birthdays.length - 5} more birthdays
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
