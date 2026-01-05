import { Button } from "@appstandard/ui";
import { Link } from "@tanstack/react-router";
import { FileUp, Merge, Plus } from "lucide-react";

export function QuickActions() {
	return (
		<div className="flex flex-wrap gap-2">
			<Button size="sm" asChild>
				<Link to="/contacts/new">
					<Plus className="mr-1.5 h-4 w-4" />
					New Address Book
				</Link>
			</Button>
			<Button size="sm" variant="outline" asChild>
				<Link to="/contacts/import">
					<FileUp className="mr-1.5 h-4 w-4" />
					Import
				</Link>
			</Button>
			<Button size="sm" variant="outline" asChild>
				<Link to="/contacts/merge">
					<Merge className="mr-1.5 h-4 w-4" />
					Merge
				</Link>
			</Button>
		</div>
	);
}
