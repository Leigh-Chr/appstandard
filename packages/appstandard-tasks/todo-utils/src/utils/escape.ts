/**
 * ICS text escaping utilities per RFC 5545
 */

/**
 * Escape special characters in ICS text values
 * Per RFC 5545, backslash, semicolon, and comma must be escaped
 * Newlines are converted to literal \n
 */
export function escapeIcsText(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Unescape ICS text values
 */
export function unescapeIcsText(text: string): string {
	return text
		.replace(/\\n/g, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line)
 */
export function foldLine(line: string): string {
	const MAX_LINE_LENGTH = 75;

	if (line.length <= MAX_LINE_LENGTH) {
		return line;
	}

	const result: string[] = [];
	let remaining = line;

	// First line can be up to 75 chars
	result.push(remaining.substring(0, MAX_LINE_LENGTH));
	remaining = remaining.substring(MAX_LINE_LENGTH);

	// Continuation lines start with space and can be up to 74 chars
	while (remaining.length > 0) {
		result.push(` ${remaining.substring(0, MAX_LINE_LENGTH - 1)}`);
		remaining = remaining.substring(MAX_LINE_LENGTH - 1);
	}

	return result.join("\r\n");
}

/**
 * Format a Date to ICS datetime format (YYYYMMDDTHHMMSSZ)
 */
export function formatDateToICS(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");

	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format a Date to ICS date-only format (YYYYMMDD)
 */
export function formatDateOnlyToICS(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}${month}${day}`;
}

/**
 * Generate a UUID for UID property
 */
export function generateUID(): string {
	return `${crypto.randomUUID()}@appstandard-tasks`;
}
