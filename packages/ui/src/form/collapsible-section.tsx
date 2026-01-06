import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CollapsibleSectionProps {
	/** Unique identifier for the section (used for aria attributes) */
	id: string;
	/** Section title displayed in the header */
	title: string;
	/** Whether the section is currently expanded */
	isExpanded: boolean;
	/** Callback when the section header is clicked */
	onToggle: () => void;
	/** Section content */
	children: React.ReactNode;
	/** Optional badge to display next to title (e.g., count) */
	badge?: string | number;
	/** Optional description shown when collapsed */
	description?: string;
	/** Optional icon to display before title */
	icon?: LucideIcon;
}

/**
 * Reusable collapsible section component for forms
 *
 * Features:
 * - Accessible with aria-expanded and aria-controls
 * - Optional icon, badge, and description
 * - Smooth hover transitions
 * - Left border accent when expanded
 *
 * @example
 * ```tsx
 * <CollapsibleSection
 *   id="details"
 *   title="Additional Details"
 *   icon={Settings}
 *   isExpanded={expandedSections.has("details")}
 *   onToggle={() => toggleSection("details")}
 * >
 *   <Input ... />
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
	id,
	title,
	isExpanded,
	onToggle,
	children,
	badge,
	description,
	icon: Icon,
}: CollapsibleSectionProps) {
	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={onToggle}
				className="group flex w-full items-center justify-between text-left font-semibold transition-colors hover:text-primary"
				aria-expanded={isExpanded}
				aria-controls={`section-${id}`}
			>
				<div className="flex flex-col items-start gap-1">
					<span className="flex items-center gap-2">
						{Icon && (
							<Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
						)}
						{title}
						{badge !== undefined && (
							<span className="font-normal text-muted-foreground text-xs">
								({badge})
							</span>
						)}
					</span>
					{description && !isExpanded && (
						<span className="font-normal text-muted-foreground text-xs">
							{description}
						</span>
					)}
				</div>
				{isExpanded ? (
					<ChevronUp
						className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
						aria-hidden="true"
					/>
				) : (
					<ChevronDown
						className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
						aria-hidden="true"
					/>
				)}
			</button>
			{isExpanded && (
				<section
					id={`section-${id}`}
					className="space-y-4 border-muted/50 border-l-2 pl-4"
					aria-label={title}
				>
					{children}
				</section>
			)}
		</div>
	);
}
