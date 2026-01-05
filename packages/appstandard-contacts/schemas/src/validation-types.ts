/**
 * Type definitions for validation errors
 * Shared between frontend and backend
 */

export interface ValidationErrors {
	displayName?: string;
	firstName?: string;
	lastName?: string;
	nickname?: string;
	organization?: string;
	title?: string;
	note?: string;
	birthday?: string;
	photo?: string;
	url?: string;
	uid?: string;
	addresses?: Record<
		number,
		{
			street?: string;
			city?: string;
			postalCode?: string;
			country?: string;
			region?: string;
		}
	>;
	emails?: Record<number, string>;
	phoneNumbers?: Record<number, string>;
}
