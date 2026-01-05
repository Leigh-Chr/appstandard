/**
 * Entity sorting utilities
 * Generic sorting functions for collections (calendars, address books, task lists)
 */

export type SortDirection = "asc" | "desc";

export interface BaseEntityForSort {
	id: string;
	name: string;
	updatedAt?: string | Date | null;
	createdAt?: string | Date | null;
}

export interface EntitySorterConfig<T extends BaseEntityForSort> {
	/**
	 * The field name that contains the item count (e.g., 'eventCount', 'contactCount', 'taskCount')
	 */
	countField: keyof T;
}

export interface EntitySorter<T extends BaseEntityForSort> {
	/**
	 * Sort entities by the specified criteria
	 */
	sort: (
		entities: T[],
		sortBy: "name" | "updatedAt" | "createdAt" | "count",
		sortDirection: SortDirection,
	) => T[];
	/**
	 * Filter entities by keyword (searches in name)
	 */
	filterByKeyword: (entities: T[], keyword: string) => T[];
	/**
	 * Sort by name (alphabetically)
	 */
	sortByName: (a: T, b: T) => number;
	/**
	 * Sort by updated date
	 */
	sortByUpdatedAt: (a: T, b: T, direction: SortDirection) => number;
	/**
	 * Sort by created date
	 */
	sortByCreatedAt: (a: T, b: T, direction: SortDirection) => number;
	/**
	 * Sort by count
	 */
	sortByCount: (a: T, b: T) => number;
}

/**
 * Compare dates for sorting
 */
function compareDates(
	a: string | Date | null | undefined,
	b: string | Date | null | undefined,
	direction: SortDirection,
): number {
	const aTime = a ? new Date(a).getTime() : 0;
	const bTime = b ? new Date(b).getTime() : 0;
	return direction === "asc" ? aTime - bTime : bTime - aTime;
}

/**
 * Create an entity sorter with the specified configuration
 * @param config - Configuration specifying the count field name
 * @returns An object with sorting and filtering functions
 *
 * @example
 * ```ts
 * // For calendars
 * const calendarSorter = createEntitySorter<CalendarForSort>({ countField: 'eventCount' });
 * const sorted = calendarSorter.sort(calendars, 'name', 'asc');
 *
 * // For address books
 * const addressBookSorter = createEntitySorter<AddressBookForSort>({ countField: 'contactCount' });
 *
 * // For task lists
 * const taskListSorter = createEntitySorter<TaskListForSort>({ countField: 'taskCount' });
 * ```
 */
export function createEntitySorter<T extends BaseEntityForSort>(
	config: EntitySorterConfig<T>,
): EntitySorter<T> {
	const { countField } = config;

	const sortByName = (a: T, b: T): number => {
		return a.name.localeCompare(b.name);
	};

	const sortByUpdatedAt = (a: T, b: T, direction: SortDirection): number => {
		return compareDates(a.updatedAt, b.updatedAt, direction);
	};

	const sortByCreatedAt = (a: T, b: T, direction: SortDirection): number => {
		return compareDates(a.createdAt, b.createdAt, direction);
	};

	const sortByCount = (a: T, b: T): number => {
		const aCount = (a[countField] as number) || 0;
		const bCount = (b[countField] as number) || 0;
		return aCount - bCount;
	};

	const sort = (
		entities: T[],
		sortBy: "name" | "updatedAt" | "createdAt" | "count",
		sortDirection: SortDirection,
	): T[] => {
		const sorted = [...entities];

		switch (sortBy) {
			case "name":
				sorted.sort(sortByName);
				break;
			case "updatedAt":
				sorted.sort((a, b) => sortByUpdatedAt(a, b, sortDirection));
				break;
			case "createdAt":
				sorted.sort((a, b) => sortByCreatedAt(a, b, sortDirection));
				break;
			case "count":
				sorted.sort(sortByCount);
				break;
		}

		return sorted;
	};

	const filterByKeyword = (entities: T[], keyword: string): T[] => {
		if (!keyword.trim()) {
			return entities;
		}
		const searchLower = keyword.trim().toLowerCase();
		return entities.filter((entity) =>
			entity.name.toLowerCase().includes(searchLower),
		);
	};

	return {
		sort,
		filterByKeyword,
		sortByName,
		sortByUpdatedAt,
		sortByCreatedAt,
		sortByCount,
	};
}

/**
 * Standalone date comparison utility
 */
export { compareDates };
