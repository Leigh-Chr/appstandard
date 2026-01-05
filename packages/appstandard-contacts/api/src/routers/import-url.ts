/**
 * Address book import from URL operations
 * Supports importing vCard files from external URLs
 */

import {
	assertValidExternalUrl,
	authOrAnonProcedure,
	createUrlImportCircuitBreaker,
	router,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	type ParsedContact,
	parseVCardFile,
} from "@appstandard-contacts/vcard-utils";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { checkAddressBookLimit, verifyAddressBookAccess } from "../middleware";

// Create circuit breaker instance for this service
const urlImportCircuitBreaker = createUrlImportCircuitBreaker(
	"AppStandard Contacts",
);

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
 * Fetch vCard content from URL with error handling and circuit breaker
 * Security: SSRF protection via assertValidExternalUrl validation
 */
async function fetchVCardContent(
	url: string,
	timeout = 60000,
): Promise<string> {
	// SECURITY: Validate URL against SSRF attacks before fetching
	// This is defense-in-depth - callers should also validate
	assertValidExternalUrl(url);

	return urlImportCircuitBreaker.execute(async () => {
		try {
			// nosemgrep: codacy.tools-configs.rules_lgpl_javascript_ssrf_rule-node-ssrf
			const response = await fetch(url, {
				headers: {
					Accept: "text/vcard, text/x-vcard, text/directory, */*",
					"User-Agent": "AppStandard Contacts/1.0",
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
 * Parse contact kind from vCard to Prisma enum
 */
function parseContactKind(
	kind?: string,
): "INDIVIDUAL" | "GROUP" | "ORG" | "LOCATION" {
	if (!kind) return "INDIVIDUAL";
	const normalized = kind.toUpperCase();
	if (
		normalized === "INDIVIDUAL" ||
		normalized === "GROUP" ||
		normalized === "ORG" ||
		normalized === "LOCATION"
	) {
		return normalized;
	}
	return "INDIVIDUAL";
}

/**
 * Parse gender from vCard to Prisma enum
 */
function parseGender(gender?: string): "M" | "F" | "O" | "N" | "U" | null {
	if (!gender) return null;
	const normalized = gender.toUpperCase();
	if (
		normalized === "M" ||
		normalized === "F" ||
		normalized === "O" ||
		normalized === "N" ||
		normalized === "U"
	) {
		return normalized;
	}
	return null;
}

/**
 * Create contact from parsed vCard data
 */
async function createContactFromParsed(
	addressBookId: string,
	parsedContact: ParsedContact,
) {
	return await prisma.contact.create({
		data: {
			addressBookId,
			formattedName: parsedContact.formattedName,
			familyName: parsedContact.familyName || null,
			givenName: parsedContact.givenName || null,
			additionalName: parsedContact.additionalName || null,
			namePrefix: parsedContact.namePrefix || null,
			nameSuffix: parsedContact.nameSuffix || null,
			nickname: parsedContact.nickname || null,
			photoUrl: parsedContact.photoUrl || null,
			birthday: parsedContact.birthday || null,
			anniversary: parsedContact.anniversary || null,
			gender: parseGender(parsedContact.gender),
			organization: parsedContact.organization || null,
			title: parsedContact.title || null,
			role: parsedContact.role || null,
			geoLatitude: parsedContact.geoLatitude ?? null,
			geoLongitude: parsedContact.geoLongitude ?? null,
			timezone: parsedContact.timezone || null,
			note: parsedContact.note || null,
			url: parsedContact.url || null,
			kind: parseContactKind(parsedContact.kind),
			uid: parsedContact.uid || null,
			revision: parsedContact.revision || null,
			...(parsedContact.emails
				? {
						emails: {
							create: parsedContact.emails.map((e) => ({
								email: e.email,
								type: e.type || null,
								isPrimary: e.isPrimary ?? false,
							})),
						},
					}
				: {}),
			...(parsedContact.phones
				? {
						phones: {
							create: parsedContact.phones.map((p) => ({
								number: p.number,
								type: p.type || null,
								isPrimary: p.isPrimary ?? false,
							})),
						},
					}
				: {}),
			...(parsedContact.addresses
				? {
						addresses: {
							create: parsedContact.addresses.map((a) => ({
								type: a.type || null,
								streetAddress: a.streetAddress || null,
								locality: a.locality || null,
								region: a.region || null,
								postalCode: a.postalCode || null,
								country: a.country || null,
								isPrimary: a.isPrimary ?? false,
							})),
						},
					}
				: {}),
			...(parsedContact.imHandles
				? {
						imHandles: {
							create: parsedContact.imHandles.map((im) => ({
								handle: im.handle,
								service: im.service,
							})),
						},
					}
				: {}),
			...(parsedContact.categories
				? {
						categories: {
							create: parsedContact.categories.map((cat) => ({
								category: cat,
							})),
						},
					}
				: {}),
			...(parsedContact.relations
				? {
						relations: {
							create: parsedContact.relations.map((r) => ({
								relatedName: r.relatedName,
								relationType: r.relationType,
							})),
						},
					}
				: {}),
		},
	});
}

export const importUrlRouter = router({
	/**
	 * Import contacts from vCard content into existing address book
	 */
	importIntoAddressBook: authOrAnonProcedure
		.input(
			z.object({
				addressBookId: z.string(),
				fileContent: z.string(),
				removeDuplicates: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.addressBookId },
				include: { contacts: true },
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			validateFileSize(input.fileContent);

			const parseResult = parseVCardFile(input.fileContent);

			if (parseResult.errors.length > 0 && parseResult.contacts.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			let contactsToImport = parseResult.contacts;
			let skippedDuplicates = 0;

			if (input.removeDuplicates && addressBook.contacts.length > 0) {
				// Simple duplicate detection by UID or formattedName
				const existingUids = new Set(
					addressBook.contacts.filter((c) => c.uid).map((c) => c.uid),
				);
				const existingNames = new Set(
					addressBook.contacts.map((c) => c.formattedName),
				);

				const unique: ParsedContact[] = [];
				for (const contact of parseResult.contacts) {
					const isDuplicate =
						(contact.uid && existingUids.has(contact.uid)) ||
						existingNames.has(contact.formattedName);

					if (isDuplicate) {
						skippedDuplicates++;
					} else {
						unique.push(contact);
					}
				}
				contactsToImport = unique;
			}

			if (contactsToImport.length > 0) {
				for (const parsedContact of contactsToImport) {
					await createContactFromParsed(input.addressBookId, parsedContact);
				}
			}

			return {
				importedContacts: contactsToImport.length,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Import an address book from a URL
	 * Creates a new address book with the sourceUrl stored for future refresh
	 */
	importFromUrl: authOrAnonProcedure
		.input(
			z.object({
				url: z.string().url("Invalid URL"),
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await checkAddressBookLimit(ctx);

			// Validate URL against SSRF attacks
			assertValidExternalUrl(input.url);

			// Fetch the vCard content from the URL with circuit breaker
			const vcardContent = await fetchVCardContent(input.url, 30000);

			validateFileSize(vcardContent);
			const parseResult = parseVCardFile(vcardContent);

			if (parseResult.errors.length > 0 && parseResult.contacts.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			// Create address book with sourceUrl
			const addressBook = await prisma.addressBook.create({
				data: {
					name:
						input.name ||
						`Imported Contacts - ${new Date().toLocaleDateString("en-US")}`,
					userId: ctx.session?.user?.id || ctx.anonymousId || null,
					sourceUrl: input.url,
					lastSyncedAt: new Date(),
				},
			});

			// Create contacts
			if (parseResult.contacts.length > 0) {
				for (const parsedContact of parseResult.contacts) {
					await createContactFromParsed(addressBook.id, parsedContact);
				}
			}

			return {
				addressBook,
				importedContacts: parseResult.contacts.length,
				warnings: parseResult.errors,
			};
		}),

	/**
	 * Refresh an address book from its source URL
	 */
	refreshFromUrl: authOrAnonProcedure
		.input(
			z.object({
				addressBookId: z.string(),
				replaceAll: z.boolean().default(false),
				skipDuplicates: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.addressBookId },
				include: { contacts: true },
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			if (!addressBook.sourceUrl) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"This address book has no source URL. It cannot be refreshed.",
				});
			}

			// Validate URL against SSRF attacks
			assertValidExternalUrl(addressBook.sourceUrl);

			let deletedCount = 0;
			if (input.replaceAll) {
				const deleteResult = await prisma.contact.deleteMany({
					where: { addressBookId: input.addressBookId },
				});
				deletedCount = deleteResult.count;
			}

			const vcardContent = await fetchVCardContent(addressBook.sourceUrl);
			validateFileSize(vcardContent);
			const parseResult = parseVCardFile(vcardContent);

			if (parseResult.errors.length > 0 && parseResult.contacts.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unable to parse file: ${parseResult.errors.join(", ")}`,
				});
			}

			let contactsToImport = parseResult.contacts;
			let skippedDuplicates = 0;

			if (input.skipDuplicates && !input.replaceAll) {
				const existingUids = new Set(
					addressBook.contacts.filter((c) => c.uid).map((c) => c.uid),
				);
				const existingNames = new Set(
					addressBook.contacts.map((c) => c.formattedName),
				);

				const unique: ParsedContact[] = [];
				for (const contact of parseResult.contacts) {
					const isDuplicate =
						(contact.uid && existingUids.has(contact.uid)) ||
						existingNames.has(contact.formattedName);

					if (isDuplicate) {
						skippedDuplicates++;
					} else {
						unique.push(contact);
					}
				}
				contactsToImport = unique;
			}

			if (contactsToImport.length > 0) {
				for (const parsedContact of contactsToImport) {
					await createContactFromParsed(input.addressBookId, parsedContact);
				}
			}

			// Update lastSyncedAt
			await prisma.addressBook.update({
				where: { id: input.addressBookId },
				data: { lastSyncedAt: new Date() },
			});

			return {
				importedContacts: contactsToImport.length,
				deletedContacts: deletedCount,
				skippedDuplicates,
				warnings: parseResult.errors,
			};
		}),
});
