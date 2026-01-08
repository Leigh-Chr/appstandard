/**
 * Content Indexing API hook for PWA
 * Allows indexing app content for device search
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Content_Index_API
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

export type ContentCategory = "article" | "homepage" | "video" | "audio" | "";

export interface ContentDescription {
	/** Unique identifier for the content */
	id: string;
	/** Title of the content */
	title: string;
	/** Description of the content */
	description: string;
	/** URL to the content (relative or absolute) */
	url: string;
	/** Category of the content */
	category?: ContentCategory;
	/** Icons for the content */
	icons?: Array<{
		src: string;
		sizes?: string;
		type?: string;
	}>;
}

export interface UseContentIndexReturn {
	/** Whether Content Indexing API is supported */
	isSupported: boolean;
	/** Add content to the index */
	add: (content: ContentDescription) => Promise<boolean>;
	/** Remove content from the index */
	remove: (id: string) => Promise<boolean>;
	/** Get all indexed content */
	getAll: () => Promise<ContentDescription[]>;
}

// Extend ServiceWorkerRegistration for Content Index API
interface ContentIndex {
	add(description: ContentDescription): Promise<void>;
	delete(id: string): Promise<void>;
	getAll(): Promise<ContentDescription[]>;
}

interface ServiceWorkerRegistrationWithIndex extends ServiceWorkerRegistration {
	index?: ContentIndex;
}

/**
 * Hook to use the Content Indexing API
 * Makes app content discoverable through device search
 *
 * @example
 * ```tsx
 * function EventPage({ event }) {
 *   const { isSupported, add, remove } = useContentIndex();
 *
 *   useEffect(() => {
 *     if (isSupported) {
 *       add({
 *         id: `event-${event.id}`,
 *         title: event.summary,
 *         description: event.description || '',
 *         url: `/events/${event.id}`,
 *         category: 'article',
 *       });
 *     }
 *
 *     return () => {
 *       if (isSupported) {
 *         remove(`event-${event.id}`);
 *       }
 *     };
 *   }, [event.id]);
 * }
 * ```
 */
export function useContentIndex(): UseContentIndexReturn {
	const registrationRef = useRef<ServiceWorkerRegistrationWithIndex | null>(
		null,
	);

	const isSupported = useMemo(() => {
		if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
			return false;
		}
		// We'll check for index support when we get the registration
		return true;
	}, []);

	// Get service worker registration on mount
	useEffect(() => {
		if (!isSupported) return;

		const getRegistration = async () => {
			try {
				const registration = await navigator.serviceWorker.ready;
				registrationRef.current =
					registration as ServiceWorkerRegistrationWithIndex;
			} catch {
				// Service worker not available
			}
		};

		getRegistration();
	}, [isSupported]);

	const add = useCallback(
		async (content: ContentDescription): Promise<boolean> => {
			const registration = registrationRef.current;
			if (!registration?.index) {
				return false;
			}

			try {
				await registration.index.add(content);
				return true;
			} catch (error) {
				console.warn("Failed to add content to index:", error);
				return false;
			}
		},
		[],
	);

	const remove = useCallback(async (id: string): Promise<boolean> => {
		const registration = registrationRef.current;
		if (!registration?.index) {
			return false;
		}

		try {
			await registration.index.delete(id);
			return true;
		} catch (error) {
			console.warn("Failed to remove content from index:", error);
			return false;
		}
	}, []);

	const getAll = useCallback(async (): Promise<ContentDescription[]> => {
		const registration = registrationRef.current;
		if (!registration?.index) {
			return [];
		}

		try {
			return await registration.index.getAll();
		} catch {
			return [];
		}
	}, []);

	return {
		isSupported,
		add,
		remove,
		getAll,
	};
}

/**
 * Index a calendar event for device search
 */
export async function indexCalendarEvent(event: {
	id: string;
	summary: string;
	description?: string;
}): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = (await navigator.serviceWorker
			.ready) as ServiceWorkerRegistrationWithIndex;
		if (!registration.index) {
			return false;
		}

		await registration.index.add({
			id: `calendar-event-${event.id}`,
			title: event.summary,
			description: event.description || "Calendar event",
			url: `/events/${event.id}`,
			category: "article",
		});

		return true;
	} catch {
		return false;
	}
}

/**
 * Index a task for device search
 */
export async function indexTask(task: {
	id: string;
	summary: string;
	description?: string;
}): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = (await navigator.serviceWorker
			.ready) as ServiceWorkerRegistrationWithIndex;
		if (!registration.index) {
			return false;
		}

		await registration.index.add({
			id: `task-${task.id}`,
			title: task.summary,
			description: task.description || "Task",
			url: `/tasks/${task.id}`,
			category: "article",
		});

		return true;
	} catch {
		return false;
	}
}

/**
 * Index a contact for device search
 */
export async function indexContact(contact: {
	id: string;
	name: string;
	email?: string;
}): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = (await navigator.serviceWorker
			.ready) as ServiceWorkerRegistrationWithIndex;
		if (!registration.index) {
			return false;
		}

		await registration.index.add({
			id: `contact-${contact.id}`,
			title: contact.name,
			description: contact.email || "Contact",
			url: `/contacts/${contact.id}`,
			category: "article",
		});

		return true;
	} catch {
		return false;
	}
}

/**
 * Remove indexed content
 */
export async function removeFromIndex(id: string): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = (await navigator.serviceWorker
			.ready) as ServiceWorkerRegistrationWithIndex;
		if (!registration.index) {
			return false;
		}

		await registration.index.delete(id);
		return true;
	} catch {
		return false;
	}
}
