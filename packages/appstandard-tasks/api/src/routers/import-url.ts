/**
 * Task list import from URL operations
 * Supports importing VTODO (ICS) files from external URLs
 */

import {
	assertValidExternalUrl,
	authOrAnonProcedure,
	createUrlImportCircuitBreaker,
	router,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { type ParsedTask, parseTodoFile } from "@appstandard-tasks/todo-utils";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { checkTaskListLimit, verifyTaskListAccess } from "../middleware";

// Create circuit breaker instance for this service
const urlImportCircuitBreaker =
	createUrlImportCircuitBreaker("AppStandard Tasks");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file size
 */
function validateFileSize(fileContent: string): void {
	const fileSizeBytes = Buffer.byteLength(fileContent, "utf8");
	if (fileSizeBytes > MAX_FILE_SIZE) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `File too large. Maximum allowed size: 5MB. Current size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`,
		});
	}
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
			message: `File URL not found (404). The file at ${url} is no longer available.`,
		};
	}

	if (status >= 500) {
		return {
			code: "INTERNAL_SERVER_ERROR",
			message: `Unable to retrieve file: ${status}`,
		};
	}

	return {
		code: "BAD_REQUEST",
		message: `Unable to retrieve file: ${status}`,
	};
}

/**
 * Fetch ICS content from URL with error handling and circuit breaker
 * Security: SSRF protection via assertValidExternalUrl validation
 */
async function fetchIcsContent(url: string, timeout = 60000): Promise<string> {
	// SECURITY: Validate URL against SSRF attacks before fetching
	// This is defense-in-depth - callers should also validate
	assertValidExternalUrl(url);

	return urlImportCircuitBreaker.execute(async () => {
		try {
			// nosemgrep: codacy.tools-configs.rules_lgpl_javascript_ssrf_rule-node-ssrf
			const response = await fetch(url, {
				headers: {
					Accept: "text/calendar, application/calendar+xml, */*",
					"User-Agent": "AppStandard Tasks/1.0",
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

			return await response.text();
		} catch (error) {
			if (error instanceof TRPCError) throw error;

			if (error instanceof Error && error.name === "AbortError") {
				throw new TRPCError({
					code: "TIMEOUT",
					message:
						"Request timed out while fetching file. The server may be slow or unreachable.",
				});
			}

			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Error retrieving file: ${error instanceof Error ? error.message : "Unknown error"}`,
			});
		}
	});
}

/**
 * Parse task status from ICS to Prisma enum
 */
function parseTaskStatus(
	status?: string,
): "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED" {
	if (!status) return "NEEDS_ACTION";
	const normalized = status.toUpperCase().replace("-", "_");
	if (
		normalized === "NEEDS_ACTION" ||
		normalized === "IN_PROCESS" ||
		normalized === "COMPLETED" ||
		normalized === "CANCELLED"
	) {
		return normalized;
	}
	return "NEEDS_ACTION";
}

/**
 * Parse task class from ICS to Prisma enum
 */
function parseTaskClass(
	taskClass?: string,
): "PUBLIC" | "PRIVATE" | "CONFIDENTIAL" | null {
	if (!taskClass) return null;
	const normalized = taskClass.toUpperCase();
	if (
		normalized === "PUBLIC" ||
		normalized === "PRIVATE" ||
		normalized === "CONFIDENTIAL"
	) {
		return normalized;
	}
	return null;
}

/**
 * Parse attendee role
 */
function parseAttendeeRole(
	role?: string,
): "CHAIR" | "REQ_PARTICIPANT" | "OPT_PARTICIPANT" | "NON_PARTICIPANT" | null {
	if (!role) return null;
	const normalized = role.toUpperCase().replace("-", "_");
	if (
		normalized === "CHAIR" ||
		normalized === "REQ_PARTICIPANT" ||
		normalized === "OPT_PARTICIPANT" ||
		normalized === "NON_PARTICIPANT"
	) {
		return normalized;
	}
	return null;
}

/**
 * Parse attendee status
 */
function parseAttendeeStatus(
	status?: string,
): "NEEDS_ACTION" | "ACCEPTED" | "DECLINED" | "TENTATIVE" | "DELEGATED" | null {
	if (!status) return null;
	const normalized = status.toUpperCase().replace("-", "_");
	if (
		normalized === "NEEDS_ACTION" ||
		normalized === "ACCEPTED" ||
		normalized === "DECLINED" ||
		normalized === "TENTATIVE" ||
		normalized === "DELEGATED"
	) {
		return normalized;
	}
	return null;
}

/**
 * Parse alarm action
 */
function parseAlarmAction(
	action?: string,
): "DISPLAY" | "EMAIL" | "AUDIO" | null {
	if (!action) return null;
	const normalized = action.toUpperCase();
	if (
		normalized === "DISPLAY" ||
		normalized === "EMAIL" ||
		normalized === "AUDIO"
	) {
		return normalized;
	}
	return null;
}

/**
 * Create task from parsed ICS data
 */
async function createTaskFromParsed(
	taskListId: string,
	parsedTask: ParsedTask,
) {
	return await prisma.task.create({
		data: {
			taskListId,
			title: parsedTask.summary,
			description: parsedTask.description || null,
			status: parseTaskStatus(parsedTask.status),
			priority: parsedTask.priority ?? null,
			percentComplete: parsedTask.percentComplete ?? null,
			startDate: parsedTask.dtstart || null,
			dueDate: parsedTask.due || null,
			completedAt: parsedTask.completed || null,
			location: parsedTask.location || null,
			geoLatitude: parsedTask.geoLatitude ?? null,
			geoLongitude: parsedTask.geoLongitude ?? null,
			organizerName: parsedTask.organizerName || null,
			organizerEmail: parsedTask.organizerEmail || null,
			uid: parsedTask.uid || null,
			dtstamp: parsedTask.dtstamp || new Date(),
			created: parsedTask.created || null,
			lastModified: parsedTask.lastModified || null,
			sequence: parsedTask.sequence ?? 0,
			class: parseTaskClass(parsedTask.class),
			url: parsedTask.url || null,
			comment: parsedTask.comment || null,
			rrule: parsedTask.rrule || null,
			relatedTo: parsedTask.relatedTo || null,
			...(parsedTask.categories
				? {
						categories: {
							create: parsedTask.categories.map((cat) => ({
								category: cat,
							})),
						},
					}
				: {}),
			...(parsedTask.attendees
				? {
						attendees: {
							create: parsedTask.attendees.map((a) => ({
								name: a.name || null,
								email: a.email,
								role: parseAttendeeRole(a.role),
								status: parseAttendeeStatus(a.status),
								rsvp: a.rsvp ?? false,
							})),
						},
					}
				: {}),
			...(parsedTask.alarms
				? {
						alarms: {
							create: parsedTask.alarms.map((a) => {
								const action = parseAlarmAction(a.action);
								return {
									trigger: a.trigger,
									action: action || "DISPLAY",
									summary: a.summary || null,
									description: a.description || null,
									duration: a.duration || null,
									repeat: a.repeat ?? null,
								};
							}),
						},
					}
				: {}),
			...(parsedTask.rdate || parsedTask.exdate
				? {
						recurrenceDates: {
							create: [
								...(parsedTask.rdate || []).map((d) => ({
									date: d,
									type: "RDATE" as const,
								})),
								...(parsedTask.exdate || []).map((d) => ({
									date: d,
									type: "EXDATE" as const,
								})),
							],
						},
					}
				: {}),
		},
	});
}

export const importUrlRouter = router({
	/**
	 * Import tasks from ICS content into existing task list
	 */
	importIntoTaskList: authOrAnonProcedure
		.input(
			z.object({
				taskListId: z.string(),
				fileContent: z.string(),
				removeDuplicates: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.taskListId },
				include: { tasks: true },
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			validateFileSize(input.fileContent);

			const parseResult = parseTodoFile(input.fileContent);

			if (parseResult.errors.length > 0 && parseResult.tasks.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			let tasksToImport = parseResult.tasks;
			let skippedDuplicates = 0;

			if (input.removeDuplicates && taskList.tasks.length > 0) {
				// Simple duplicate detection by UID or title
				const existingUids = new Set(
					taskList.tasks.filter((t) => t.uid).map((t) => t.uid),
				);
				const existingTitles = new Set(taskList.tasks.map((t) => t.title));

				const unique: ParsedTask[] = [];
				for (const task of parseResult.tasks) {
					const isDuplicate =
						(task.uid && existingUids.has(task.uid)) ||
						existingTitles.has(task.summary);

					if (isDuplicate) {
						skippedDuplicates++;
					} else {
						unique.push(task);
					}
				}
				tasksToImport = unique;
			}

			if (tasksToImport.length > 0) {
				for (const parsedTask of tasksToImport) {
					await createTaskFromParsed(input.taskListId, parsedTask);
				}
			}

			return {
				importedTasks: tasksToImport.length,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Import a task list from a URL
	 * Creates a new task list with the sourceUrl stored for future refresh
	 */
	importFromUrl: authOrAnonProcedure
		.input(
			z.object({
				url: z.string().url("Invalid URL"),
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await checkTaskListLimit(ctx);

			// Validate URL against SSRF attacks
			assertValidExternalUrl(input.url);

			// Fetch the ICS content from the URL with circuit breaker
			const icsContent = await fetchIcsContent(input.url, 30000);

			validateFileSize(icsContent);
			const parseResult = parseTodoFile(icsContent);

			if (parseResult.errors.length > 0 && parseResult.tasks.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			// Create task list with sourceUrl
			const taskList = await prisma.taskList.create({
				data: {
					name:
						input.name ||
						`Imported Tasks - ${new Date().toLocaleDateString("en-US")}`,
					userId: ctx.session?.user?.id || ctx.anonymousId || null,
					sourceUrl: input.url,
					lastSyncedAt: new Date(),
				},
			});

			// Create tasks
			if (parseResult.tasks.length > 0) {
				for (const parsedTask of parseResult.tasks) {
					await createTaskFromParsed(taskList.id, parsedTask);
				}
			}

			return {
				taskList,
				importedTasks: parseResult.tasks.length,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Refresh a task list from its source URL
	 */
	refreshFromUrl: authOrAnonProcedure
		.input(
			z.object({
				taskListId: z.string(),
				replaceAll: z.boolean().default(false),
				skipDuplicates: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.taskListId },
				include: { tasks: true },
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			if (!taskList.sourceUrl) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This task list has no source URL. It cannot be refreshed.",
				});
			}

			// Validate URL against SSRF attacks
			assertValidExternalUrl(taskList.sourceUrl);

			let deletedCount = 0;
			if (input.replaceAll) {
				const deleteResult = await prisma.task.deleteMany({
					where: { taskListId: input.taskListId },
				});
				deletedCount = deleteResult.count;
			}

			const icsContent = await fetchIcsContent(taskList.sourceUrl);
			validateFileSize(icsContent);
			const parseResult = parseTodoFile(icsContent);

			if (parseResult.errors.length > 0 && parseResult.tasks.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			let tasksToImport = parseResult.tasks;
			let skippedDuplicates = 0;

			if (input.skipDuplicates && !input.replaceAll) {
				const existingUids = new Set(
					taskList.tasks.filter((t) => t.uid).map((t) => t.uid),
				);
				const existingTitles = new Set(taskList.tasks.map((t) => t.title));

				const unique: ParsedTask[] = [];
				for (const task of parseResult.tasks) {
					const isDuplicate =
						(task.uid && existingUids.has(task.uid)) ||
						existingTitles.has(task.summary);

					if (isDuplicate) {
						skippedDuplicates++;
					} else {
						unique.push(task);
					}
				}
				tasksToImport = unique;
			}

			if (tasksToImport.length > 0) {
				for (const parsedTask of tasksToImport) {
					await createTaskFromParsed(input.taskListId, parsedTask);
				}
			}

			// Update lastSyncedAt
			await prisma.taskList.update({
				where: { id: input.taskListId },
				data: { lastSyncedAt: new Date() },
			});

			return {
				importedTasks: tasksToImport.length,
				deletedTasks: deletedCount,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),
});
