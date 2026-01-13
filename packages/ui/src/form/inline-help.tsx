/**
 * UX-006: Inline Help Component
 * Provides collapsible help text for form fields
 */

import { cn } from "@appstandard/react-utils";
import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

export interface InlineHelpProps {
	/** Help text content */
	children: React.ReactNode;
	/** Whether help is visible by default */
	defaultOpen?: boolean;
	/** Additional class names */
	className?: string;
	/** Label for the help toggle button (accessibility) */
	toggleLabel?: string;
}

/**
 * Collapsible inline help component for form fields
 *
 * @example
 * ```tsx
 * <div>
 *   <Label>Email</Label>
 *   <Input type="email" />
 *   <InlineHelp>
 *     Your email will be used for account notifications only.
 *   </InlineHelp>
 * </div>
 * ```
 */
export function InlineHelp({
	children,
	defaultOpen = false,
	className,
	toggleLabel = "Toggle help",
}: InlineHelpProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className={cn("relative mt-1", className)}>
			{isOpen ? (
				<div
					className="flex items-start gap-2 rounded-md border border-muted bg-muted/30 p-2 text-muted-foreground text-xs"
					role="note"
				>
					<HelpCircle
						className="mt-0.5 h-3.5 w-3.5 shrink-0"
						aria-hidden="true"
					/>
					<div className="flex-1">{children}</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Close help"
					>
						<X className="h-3.5 w-3.5" aria-hidden="true" />
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
					aria-label={toggleLabel}
					aria-expanded={isOpen}
				>
					<HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
					<span>Help</span>
				</button>
			)}
		</div>
	);
}
