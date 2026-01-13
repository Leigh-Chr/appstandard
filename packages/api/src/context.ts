/**
 * Re-export context from api-core for consistency
 * All API packages should use the same context creation logic
 */
// biome-ignore lint/performance/noBarrelFile: intentional re-export for API consistency
export {
	type Context,
	type CreateContextOptions,
	createContext,
	isValidAnonymousId,
} from "@appstandard/api-core";
