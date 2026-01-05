/**
 * Address book entity types
 */

/**
 * Address book entity - Database representation
 */
export interface AddressBookEntity {
	id: string;
	name: string;
	color?: string | null;
	userId?: string | null;
	sourceUrl?: string | null;
	lastSyncedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Address book summary with contact count
 */
export interface AddressBookSummary {
	id: string;
	name: string;
	color?: string | null;
	contactCount: number;
}
