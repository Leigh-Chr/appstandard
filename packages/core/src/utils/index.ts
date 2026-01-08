/**
 * Core utilities exports
 */

// Comma-separated lists (generic utility)
export {
	addCategory,
	addTag,
	addToList,
	getLastItem,
	getLastTag,
	hasCategory,
	hasItem,
	hasTag,
	parseCategories,
	parseList,
	parseTags,
	removeCategory,
	removeFromList,
	removeTag,
	stringifyCategories,
	stringifyList,
	stringifyTags,
} from "./comma-separated";

// Dates
export {
	addDaysToDate,
	addHoursToDate,
	addMinutesToDate,
	endOfDay,
	formatDateShort,
	formatEventDuration,
	getDurationMinutes,
	isSameDay,
	isValidDate,
	normalizeDate,
	startOfDay,
	toDateTimeLocal,
} from "./date";

// Deep equality
export { deepClone, deepEqual, shallowClone } from "./deep-equal";

// Form
export { initializeFormData, transformEventFormData } from "./form";
