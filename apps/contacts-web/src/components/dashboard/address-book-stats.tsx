import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { BookUser } from "lucide-react";

interface AddressBookStatsProps {
	addressBooks: {
		id: string;
		name: string;
		contactCount: number;
		color: string | null;
	}[];
}

export function AddressBookStats({ addressBooks }: AddressBookStatsProps) {
	const total = addressBooks.reduce((sum, book) => sum + book.contactCount, 0);

	if (addressBooks.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<BookUser className="h-4 w-4" />
						Address Books
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No address books yet
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<BookUser className="h-4 w-4" />
					Address Books
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{addressBooks.slice(0, 6).map((book) => {
						const percentage =
							total > 0 ? Math.round((book.contactCount / total) * 100) : 0;
						return (
							<div key={book.id} className="space-y-1">
								<div className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded-full"
											style={{
												backgroundColor: book.color || "hsl(var(--primary))",
											}}
										/>
										<span className="truncate font-medium">{book.name}</span>
									</div>
									<span className="text-muted-foreground">
										{book.contactCount} ({percentage}%)
									</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full transition-all"
										style={{
											width: `${percentage}%`,
											backgroundColor: book.color || "hsl(var(--primary))",
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>
				{addressBooks.length > 6 && (
					<p className="mt-3 text-center text-muted-foreground text-xs">
						+{addressBooks.length - 6} more address books
					</p>
				)}
			</CardContent>
		</Card>
	);
}
