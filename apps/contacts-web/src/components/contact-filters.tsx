/**
 * Contact list filter components
 */

import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";

// ----- Types -----

export type ContactSortBy = "name" | "organization" | "updated";
export type SortDirection = "asc" | "desc";

export interface ContactFilterState {
	search: string;
	sortBy: ContactSortBy;
	sortDirection: SortDirection;
}

export const INITIAL_CONTACT_FILTER_STATE: ContactFilterState = {
	search: "",
	sortBy: "name",
	sortDirection: "asc",
};

// ----- Search and Sort Bar -----

interface ContactSearchSortBarProps {
	search: string;
	sortBy: ContactSortBy;
	sortDirection: SortDirection;
	onSearchChange: (search: string) => void;
	onSortChange: (sortBy: ContactSortBy) => void;
	onSortDirectionChange: (direction: SortDirection) => void;
}

const SORT_LABELS: Record<ContactSortBy, string> = {
	name: "Name",
	organization: "Organization",
	updated: "Recently Updated",
};

export function ContactSearchSortBar({
	search,
	sortBy,
	sortDirection,
	onSearchChange,
	onSortChange,
	onSortDirectionChange,
}: ContactSearchSortBarProps) {
	const handleDirectionToggle = () => {
		onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
	};

	return (
		<div className="flex flex-col gap-2 sm:flex-row">
			<div className="flex-1">
				<div className="relative">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search contacts..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pr-9 pl-9"
						aria-label="Search contacts by name, email, or organization"
					/>
					{search && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-1/2 right-1 h-8 min-h-[44px] w-8 -translate-y-1/2 sm:h-6 sm:min-h-0 sm:w-6"
							onClick={() => onSearchChange("")}
							aria-label="Clear search"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Select
					value={sortBy}
					onValueChange={(v) => onSortChange(v as ContactSortBy)}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(SORT_LABELS) as ContactSortBy[]).map((sort) => (
							<SelectItem key={sort} value={sort}>
								{SORT_LABELS[sort]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					size="icon"
					onClick={handleDirectionToggle}
					className="w-[40px]"
					aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
					title={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
				>
					{sortDirection === "asc" ? (
						<ArrowUp className="h-4 w-4" />
					) : (
						<ArrowDown className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

// ----- Combined Filter Bar -----

interface ContactFilterBarProps {
	filters: ContactFilterState;
	onFiltersChange: (filters: Partial<ContactFilterState>) => void;
}

export function ContactFilterBar({
	filters,
	onFiltersChange,
}: ContactFilterBarProps) {
	return (
		<div className="space-y-3">
			<ContactSearchSortBar
				search={filters.search}
				sortBy={filters.sortBy}
				sortDirection={filters.sortDirection}
				onSearchChange={(search) => onFiltersChange({ search })}
				onSortChange={(sortBy) => onFiltersChange({ sortBy })}
				onSortDirectionChange={(sortDirection) =>
					onFiltersChange({ sortDirection })
				}
			/>
		</div>
	);
}
