/**
 * Contact item components
 * Modular components for displaying individual contacts
 */

export { ContactCard } from "./contact-card";
export { ContactNotePreview, ContactSecondaryInfo } from "./contact-details";
export { ContactGridCard } from "./contact-grid-card";
export { ContactHoverPreview } from "./contact-hover-preview";
export type {
	Contact,
	ContactAddress,
	ContactCardProps,
	ContactCategory,
	ContactGridCardProps,
} from "./types";
export { formatCategories, formatLocation, formatPosition } from "./types";
