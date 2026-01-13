/**
 * Contact Picker API hook for PWA
 * Allows selecting contacts from the device
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API
 */

import { useCallback, useMemo } from "react";

export type ContactProperty = "name" | "email" | "tel" | "address" | "icon";

export interface ContactAddress {
	city?: string;
	country?: string;
	postalCode?: string;
	region?: string;
	streetAddress?: string;
}

export interface Contact {
	name?: string[];
	email?: string[];
	tel?: string[];
	address?: ContactAddress[];
	icon?: Blob[];
}

export interface ContactPickerOptions {
	/** Properties to request from contacts */
	properties?: ContactProperty[];
	/** Allow selecting multiple contacts */
	multiple?: boolean;
}

export interface UseContactPickerReturn {
	/** Whether the Contact Picker API is supported */
	isSupported: boolean;
	/** Pick contacts from the device. Returns selected contacts or empty array if cancelled */
	pickContacts: (options?: ContactPickerOptions) => Promise<Contact[]>;
	/** Get the available properties that can be requested */
	getAvailableProperties: () => Promise<ContactProperty[]>;
}

// Extend Navigator interface for Contact Picker API
interface ContactsManager {
	select(
		properties: ContactProperty[],
		options?: { multiple?: boolean },
	): Promise<Contact[]>;
	getProperties(): Promise<ContactProperty[]>;
}

interface NavigatorWithContacts extends Navigator {
	contacts?: ContactsManager;
}

/**
 * Hook to use the Contact Picker API
 *
 * @example
 * ```tsx
 * function AttendeesPicker({ onSelect }) {
 *   const { isSupported, pickContacts } = useContactPicker();
 *
 *   const handlePick = async () => {
 *     const contacts = await pickContacts({
 *       properties: ['name', 'email'],
 *       multiple: true,
 *     });
 *
 *     const attendees = contacts
 *       .filter(c => c.email?.length)
 *       .map(c => ({
 *         name: c.name?.[0] || '',
 *         email: c.email![0],
 *       }));
 *
 *     onSelect(attendees);
 *   };
 *
 *   if (!isSupported) return null;
 *
 *   return (
 *     <button onClick={handlePick}>
 *       Add from Contacts
 *     </button>
 *   );
 * }
 * ```
 */
export function useContactPicker(): UseContactPickerReturn {
	const isSupported = useMemo(() => {
		if (typeof navigator === "undefined") {
			return false;
		}
		return "contacts" in navigator && "ContactsManager" in window;
	}, []);

	const pickContacts = useCallback(
		async (options: ContactPickerOptions = {}): Promise<Contact[]> => {
			if (!isSupported) {
				return [];
			}

			const nav = navigator as NavigatorWithContacts;
			if (!nav.contacts) {
				return [];
			}

			const properties = options.properties || ["name", "email"];

			try {
				const contacts = await nav.contacts.select(properties, {
					multiple: options.multiple ?? true,
				});
				return contacts;
			} catch (error) {
				// User cancelled or permission denied
				if (error instanceof Error) {
					if (
						error.name === "InvalidStateError" ||
						error.name === "SecurityError"
					) {
						// biome-ignore lint/suspicious/noConsole: intentional warning for API errors
						console.warn("Contact picker error:", error.message);
					}
				}
				return [];
			}
		},
		[isSupported],
	);

	const getAvailableProperties = useCallback(async (): Promise<
		ContactProperty[]
	> => {
		if (!isSupported) {
			return [];
		}

		const nav = navigator as NavigatorWithContacts;
		if (!nav.contacts) {
			return [];
		}

		try {
			return await nav.contacts.getProperties();
		} catch {
			return [];
		}
	}, [isSupported]);

	return {
		isSupported,
		pickContacts,
		getAvailableProperties,
	};
}

/**
 * Check if Contact Picker API is supported
 */
export function isContactPickerSupported(): boolean {
	if (typeof navigator === "undefined") {
		return false;
	}
	return "contacts" in navigator && "ContactsManager" in window;
}
