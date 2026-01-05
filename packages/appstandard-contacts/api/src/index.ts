/**
 * @appstandard-contacts/api
 * tRPC API routers for AppStandard Contacts
 */

// Re-export shared context from api-core
export type { Context, CreateContextOptions } from "@appstandard/api-core";
export { createContext, isValidAnonymousId } from "@appstandard/api-core";

// Routers
export type { AppRouter } from "./routers";
