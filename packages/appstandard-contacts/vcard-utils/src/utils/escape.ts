/**
 * vCard escaping and unescaping utilities
 * Based on RFC 6350 section 3.4
 */

/**
 * Escape special characters in vCard text values
 * RFC 6350: COMMA, SEMICOLON, and BACKSLASH must be escaped
 */
export function escapeVCardText(text: string): string {
	if (!text) return "";

	return text
		.replace(/\\/g, "\\\\") // Escape backslashes first
		.replace(/;/g, "\\;") // Escape semicolons
		.replace(/,/g, "\\,") // Escape commas
		.replace(/\n/g, "\\n"); // Escape newlines
}

/**
 * Unescape special characters in vCard text values
 */
export function unescapeVCardText(text: string): string {
	if (!text) return "";

	return text
		.replace(/\\n/gi, "\n") // Unescape newlines (case insensitive)
		.replace(/\\,/g, ",") // Unescape commas
		.replace(/\\;/g, ";") // Unescape semicolons
		.replace(/\\\\/g, "\\"); // Unescape backslashes last
}

/**
 * Fold a line according to RFC 6350
 * Lines should be folded at 75 octets
 */
export function foldLine(line: string, maxLength = 75): string {
	if (line.length <= maxLength) return line;

	const lines: string[] = [];
	let remaining = line;

	// First line
	lines.push(remaining.substring(0, maxLength));
	remaining = remaining.substring(maxLength);

	// Continuation lines (start with space)
	while (remaining.length > 0) {
		const chunkLength = maxLength - 1; // Account for leading space
		lines.push(` ${remaining.substring(0, chunkLength)}`);
		remaining = remaining.substring(chunkLength);
	}

	return lines.join("\r\n");
}

/**
 * Unfold a vCard string (join continuation lines)
 */
export function unfoldLines(content: string): string {
	// RFC 6350: Folded lines start with a space or tab
	return content.replace(/\r?\n[ \t]/g, "");
}

/**
 * Format a date for vCard (ISO 8601 basic format)
 * BDAY and ANNIVERSARY use format: YYYYMMDD or YYYY-MM-DD
 */
export function formatVCardDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

/**
 * Parse a vCard date (YYYYMMDD or YYYY-MM-DD or --MMDD)
 */
export function parseVCardDate(dateStr: string): Date | undefined {
	if (!dateStr) return undefined;

	// Remove dashes if present
	const normalized = dateStr.replace(/-/g, "");

	// Handle --MMDD format (no year)
	if (normalized.startsWith("--") && normalized.length === 6) {
		const month = Number.parseInt(normalized.substring(2, 4), 10) - 1;
		const day = Number.parseInt(normalized.substring(4, 6), 10);
		// Use year 0 to indicate no year specified
		const date = new Date(1900, month, day);
		if (!Number.isNaN(date.getTime())) {
			return date;
		}
		return undefined;
	}

	// Handle YYYYMMDD format
	if (normalized.length === 8) {
		const year = Number.parseInt(normalized.substring(0, 4), 10);
		const month = Number.parseInt(normalized.substring(4, 6), 10) - 1;
		const day = Number.parseInt(normalized.substring(6, 8), 10);
		const date = new Date(year, month, day);
		if (!Number.isNaN(date.getTime())) {
			return date;
		}
	}

	return undefined;
}

/**
 * Format a timestamp for vCard REV property
 * Format: YYYY-MM-DDTHH:MM:SSZ
 */
export function formatVCardTimestamp(date: Date): string {
	return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Generate a UUID v4 for UID property
 * Uses cryptographically secure random number generation
 */
export function generateUID(): string {
	// Use crypto.randomUUID if available, otherwise fallback to crypto.getRandomValues
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return `urn:uuid:${crypto.randomUUID()}`;
	}

	// Fallback using crypto.getRandomValues (available in all modern browsers and Node.js)
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);

		// Set version (4) and variant (RFC 4122) bits
		bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
		bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122

		const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
		const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
		return `urn:uuid:${uuid}`;
	}

	// Last resort fallback (should rarely be reached in modern environments)
	const hex = "0123456789abcdef";
	let uuid = "";
	for (let i = 0; i < 36; i++) {
		if (i === 8 || i === 13 || i === 18 || i === 23) {
			uuid += "-";
		} else if (i === 14) {
			uuid += "4";
		} else if (i === 19) {
			uuid += hex[(Date.now() % 4) | 8];
		} else {
			uuid += hex[(Date.now() + i) % 16];
		}
	}
	return `urn:uuid:${uuid}`;
}
