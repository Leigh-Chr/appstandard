import { Progress } from "../progress";

export interface MobileFormProgressProps {
	/** Current section number (0-indexed internally, displayed as 1-indexed) */
	currentSection: number;
	/** Total number of sections */
	totalSections: number;
	/** Optional current section name to display */
	sectionName?: string;
	/** Optional class name for container */
	className?: string;
}

/**
 * Mobile progress indicator for multi-section forms
 *
 * Displays current progress through form sections with:
 * - Section name or "Section X of Y" text
 * - Percentage complete
 * - Visual progress bar
 *
 * Designed to be sticky at the top of mobile forms.
 *
 * @example
 * ```tsx
 * {isMobile && (
 *   <MobileFormProgress
 *     currentSection={currentSection}
 *     totalSections={5}
 *     sectionName={sectionNames[currentSection]}
 *     className="sticky top-0 z-10"
 *   />
 * )}
 * ```
 */
export function MobileFormProgress({
	currentSection,
	totalSections,
	sectionName,
	className,
}: MobileFormProgressProps) {
	// Display as 1-indexed for users
	const displaySection = currentSection + 1;
	const percentage = Math.round((displaySection / totalSections) * 100);

	return (
		<div
			className={`border-b bg-card/95 px-6 py-3 backdrop-blur-sm sm:hidden ${className ?? ""}`}
		>
			<div className="mb-2 flex items-center justify-between text-xs">
				<span className="text-muted-foreground">
					{sectionName ? (
						<>
							<span className="font-medium text-foreground">{sectionName}</span>{" "}
							({displaySection}/{totalSections})
						</>
					) : (
						<>
							Section {displaySection} of {totalSections}
						</>
					)}
				</span>
				<span className="font-medium">{percentage}%</span>
			</div>
			<Progress value={percentage} className="h-1.5" />
		</div>
	);
}
