/**
 * Calendar import from URL operations
 * Extracted from calendar.ts for better maintainability
 */

import { handlePrismaError } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { authOrAnonProcedure, router } from "../../index";
import { findDuplicatesAgainstExisting } from "../../lib/duplicate-detection";
import { type ParsedEvent, parseIcsFile } from "../../lib/ics-parser";
import { assertValidExternalUrlWithDNS } from "../../lib/url-validator";
import { checkCalendarLimit, verifyCalendarAccess } from "../../middleware";
import { createEventFromParsed, validateFileSize } from "./helpers";

/**
 * Validate calendar exists and has source URL
 */
async function validateCalendarForRefresh(calendarId: string) {
	const calendar = await prisma.calendar.findUnique({
		where: { id: calendarId },
		include: { events: true },
	});

	if (!calendar) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Calendar not found",
		});
	}

	if (!calendar.sourceUrl) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This calendar has no source URL. It cannot be refreshed.",
		});
	}

	return calendar;
}

/**
 * Get HTTP error code and message from response status
 */
function getHttpError(
	status: number,
	url: string,
): { code: string; message: string } {
	if (status === 404) {
		return {
			code: "NOT_FOUND",
			message: `Calendar URL not found (404). The calendar at ${url} is no longer available.`,
		};
	}

	if (status >= 500) {
		return {
			code: "INTERNAL_SERVER_ERROR",
			message: `Unable to retrieve calendar: ${status}`,
		};
	}

	return {
		code: "BAD_REQUEST",
		message: `Unable to retrieve calendar: ${status}`,
	};
}

/**
 * Maximum response size for URL imports (5MB)
 * SECURITY: Prevents memory exhaustion from huge responses
 */
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

/**
 * Fetch ICS content from URL with error handling and circuit breaker
 * Best practice: Use circuit breaker to prevent cascading failures
 * Security: SSRF protection via assertValidExternalUrlWithDNS validation
 * Security: Response size limit to prevent memory exhaustion
 */
async function fetchIcsContent(url: string, timeout = 60000): Promise<string> {
	// SECURITY: Validate URL against SSRF attacks before fetching
	// This is defense-in-depth - callers should also validate, but this ensures safety
	await assertValidExternalUrlWithDNS(url);

	const { urlImportCircuitBreaker } = await import("../../lib/circuit-breaker");

	return urlImportCircuitBreaker.execute(async () => {
		try {
			// nosemgrep: codacy.tools-configs.rules_lgpl_javascript_ssrf_rule-node-ssrf
			const response = await fetch(url, {
				headers: {
					Accept: "text/calendar, application/calendar+xml, */*",
					"User-Agent": "AppStandard Calendar/1.0",
				},
				signal: AbortSignal.timeout(timeout),
			});

			if (!response.ok) {
				const { code, message } = getHttpError(response.status, url);
				throw new TRPCError({
					code: code as "NOT_FOUND" | "INTERNAL_SERVER_ERROR" | "BAD_REQUEST",
					message: message,
				});
			}

			// SECURITY: Check Content-Length header if available
			const contentLength = response.headers?.get?.("content-length");
			if (contentLength) {
				const size = Number.parseInt(contentLength, 10);
				if (!Number.isNaN(size) && size > MAX_RESPONSE_SIZE) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `File too large. Maximum allowed size: ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`,
					});
				}
			}

			// SECURITY: Stream and limit response body size
			// Content-Length can be spoofed, so we also check actual size
			// Note: Some environments (tests, older browsers) may not support streaming
			const reader = response.body?.getReader?.();
			if (reader) {
				const chunks: Uint8Array[] = [];
				let totalSize = 0;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					totalSize += value.length;
					if (totalSize > MAX_RESPONSE_SIZE) {
						reader.cancel();
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `File too large. Maximum allowed size: ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`,
						});
					}

					chunks.push(value);
				}

				// Combine chunks and decode as text
				const combined = new Uint8Array(totalSize);
				let offset = 0;
				for (const chunk of chunks) {
					combined.set(chunk, offset);
					offset += chunk.length;
				}

				return new TextDecoder().decode(combined);
			}

			// Fallback for environments without streaming support
			// Note: In this case we rely on Content-Length header validation above
			const text = await response.text();
			if (text.length > MAX_RESPONSE_SIZE) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `File too large. Maximum allowed size: ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`,
				});
			}
			return text;
		} catch (error) {
			if (error instanceof TRPCError) throw error;

			if (error instanceof Error && error.name === "AbortError") {
				throw new TRPCError({
					code: "TIMEOUT",
					message:
						"Request timed out while fetching calendar. The server may be slow or unreachable.",
				});
			}

			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Error retrieving calendar: ${error instanceof Error ? error.message : "Unknown error"}`,
			});
		}
	});
}

/**
 * Filter duplicate events from parsed events
 */
function filterDuplicateEvents(
	parsedEvents: ParsedEvent[],
	existingEvents: Array<{
		id: string;
		uid?: string | null;
		title: string;
		startDate: Date;
		endDate: Date;
		location?: string | null;
	}>,
): { eventsToImport: ParsedEvent[]; skippedDuplicates: number } {
	const newEventsForCheck = parsedEvents.map((e, idx) => ({
		id: `new-${idx}`,
		uid: e.uid ?? null,
		title: e.title,
		startDate: e.startDate,
		endDate: e.endDate,
		location: e.location ?? null,
	}));

	const existingEventsForCheck = existingEvents.map((e) => ({
		id: e.id,
		uid: e.uid ?? null,
		title: e.title,
		startDate: e.startDate,
		endDate: e.endDate,
		location: e.location ?? null,
	}));

	const { unique, duplicates } = findDuplicatesAgainstExisting(
		newEventsForCheck,
		existingEventsForCheck,
		{
			useUid: true,
			useTitle: true,
			dateTolerance: 60000, // 1 minute tolerance
		},
	);

	const uniqueIndices = new Set(
		unique.map((e) => Number.parseInt(e.id.replace("new-", ""), 10)),
	);

	// Filter and map events to ensure null values are converted to undefined for ParsedEvent compatibility
	const eventsToImport: ParsedEvent[] = parsedEvents
		.filter((_, idx) => uniqueIndices.has(idx))
		.map((event) => ({
			...event,
			location: event.location ?? undefined,
			uid: event.uid ?? undefined,
		}));

	return {
		eventsToImport,
		skippedDuplicates: duplicates.length,
	};
}

export const calendarImportUrlRouter = router({
	importIcsIntoCalendar: authOrAnonProcedure
		.input(
			z.object({
				calendarId: z.string(),
				fileContent: z.string(),
				removeDuplicates: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify calendar access (optimized single query)
			await verifyCalendarAccess(input.calendarId, ctx);

			// Fetch calendar with events (access already verified)
			const calendar = await prisma.calendar.findUnique({
				where: { id: input.calendarId },
				include: {
					events: true,
				},
			});

			if (!calendar) {
				// Should not happen after verifyCalendarAccess, but TypeScript safety
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Calendar not found",
				});
			}

			validateFileSize(input.fileContent);

			const parseResult = parseIcsFile(input.fileContent);

			if (parseResult.errors.length > 0 && parseResult.events.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse ICS file: ${parseResult.errors.join(", ")}`,
				});
			}

			// Filter duplicates if requested using enhanced detection
			let eventsToImport = parseResult.events;
			let skippedDuplicates = 0;

			if (input.removeDuplicates) {
				// Adapt parsed events to the duplicate check interface
				const newEventsForCheck = parseResult.events.map((e, idx) => ({
					id: `new-${idx}`,
					uid: e.uid ?? null,
					title: e.title,
					startDate: e.startDate,
					endDate: e.endDate,
					location: e.location ?? null,
				}));

				const existingEventsForCheck = calendar.events.map((e) => ({
					id: e.id,
					uid: e.uid ?? null,
					title: e.title,
					startDate: e.startDate,
					endDate: e.endDate,
					location: e.location ?? null,
				}));

				const { unique, duplicates } = findDuplicatesAgainstExisting(
					newEventsForCheck,
					existingEventsForCheck,
					{
						useUid: true,
						useTitle: true,
						dateTolerance: 60000, // 1 minute tolerance
					},
				);

				// Map back to original events
				const uniqueIndices = new Set(
					unique.map((e) => Number.parseInt(e.id.replace("new-", ""), 10)),
				);
				eventsToImport = parseResult.events.filter((_, idx) =>
					uniqueIndices.has(idx),
				);
				skippedDuplicates = duplicates.length;
			}

			// Create events
			if (eventsToImport.length > 0) {
				for (const parsedEvent of eventsToImport) {
					await createEventFromParsed(input.calendarId, parsedEvent);
				}
			}

			return {
				importedEvents: eventsToImport.length,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Import a calendar from a URL
	 * Creates a new calendar with the sourceUrl stored for future refresh
	 */
	importFromUrl: authOrAnonProcedure
		.input(
			z.object({
				url: z.string().url("Invalid URL"),
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// SECURITY: Ensure userId is always set to prevent orphaned calendars
			const userId = ctx.session?.user?.id || ctx.anonymousId;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required",
				});
			}

			await checkCalendarLimit(ctx);

			// Validate URL against SSRF attacks (includes DNS rebinding protection)
			await assertValidExternalUrlWithDNS(input.url);

			// Fetch the ICS content from the URL with circuit breaker
			// Best practice: Reuse fetchIcsContent function for consistency
			const icsContent = await fetchIcsContent(input.url, 30000); // 30 second timeout for initial import

			validateFileSize(icsContent);
			const parseResult = parseIcsFile(icsContent);

			if (parseResult.errors.length > 0 && parseResult.events.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse ICS file: ${parseResult.errors.join(", ")}`,
				});
			}

			// Create calendar with sourceUrl
			let calendar: Awaited<ReturnType<typeof prisma.calendar.create>>;
			try {
				calendar = await prisma.calendar.create({
					data: {
						name:
							input.name ||
							`Imported Calendar - ${new Date().toLocaleDateString("en-US")}`,
						userId,
						sourceUrl: input.url,
						lastSyncedAt: new Date(),
					},
				});
			} catch (error) {
				handlePrismaError(error);
				throw error; // Never reached, but TypeScript needs it
			}

			// Create events
			if (parseResult.events.length > 0) {
				for (const parsedEvent of parseResult.events) {
					await createEventFromParsed(calendar.id, parsedEvent);
				}
			}

			return {
				calendar,
				importedEvents: parseResult.events.length,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Refresh a calendar from its source URL
	 * Simple manual refresh: fetch, parse, and import events
	 */
	refreshFromUrl: authOrAnonProcedure
		.input(
			z.object({
				calendarId: z.string(),
				/** If true, removes all existing events before importing */
				replaceAll: z.boolean().default(false),
				/** If true, skips events that already exist (based on UID or title+dates) */
				skipDuplicates: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify calendar access
			await verifyCalendarAccess(input.calendarId, ctx);

			// Validate calendar exists and has source URL
			const calendar = await validateCalendarForRefresh(input.calendarId);

			// TypeScript: validateCalendarForRefresh ensures sourceUrl exists
			if (!calendar.sourceUrl) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This calendar has no source URL. It cannot be refreshed.",
				});
			}

			// Validate URL against SSRF attacks (includes DNS rebinding protection)
			await assertValidExternalUrlWithDNS(calendar.sourceUrl);

			// If replaceAll, delete all events first
			let deletedCount = 0;
			if (input.replaceAll) {
				try {
					const deleteResult = await prisma.event.deleteMany({
						where: { calendarId: input.calendarId },
					});
					deletedCount = deleteResult.count;
				} catch (error) {
					handlePrismaError(error);
					throw error; // Never reached, but TypeScript needs it
				}
			}

			// Fetch and parse ICS content
			const icsContent = await fetchIcsContent(calendar.sourceUrl);
			validateFileSize(icsContent);
			const parseResult = parseIcsFile(icsContent);

			if (parseResult.errors.length > 0 && parseResult.events.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse ICS file: ${parseResult.errors.join(", ")}`,
				});
			}

			// Filter duplicates if requested
			let eventsToImport = parseResult.events;
			let skippedDuplicates = 0;

			if (input.skipDuplicates && !input.replaceAll) {
				const result = filterDuplicateEvents(
					parseResult.events,
					calendar.events,
				);
				eventsToImport = result.eventsToImport;
				skippedDuplicates = result.skippedDuplicates;
			}

			// Create events
			if (eventsToImport.length > 0) {
				for (const parsedEvent of eventsToImport) {
					await createEventFromParsed(input.calendarId, parsedEvent);
				}
			}

			// Update lastSyncedAt
			try {
				await prisma.calendar.update({
					where: { id: input.calendarId },
					data: {
						lastSyncedAt: new Date(),
					},
				});
			} catch (error) {
				handlePrismaError(error);
				throw error; // Never reached, but TypeScript needs it
			}

			return {
				importedEvents: eventsToImport.length,
				deletedEvents: deletedCount,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),
});
