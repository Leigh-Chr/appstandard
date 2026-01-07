/**
 * TagInput - Tag management component
 * Built with emblor for robust, accessible tag input handling
 */

import { cn } from "@appstandard/react-utils";
import { TagInput as EmblorTagInput, type Tag } from "emblor";
import { useCallback, useId, useMemo, useState } from "react";
import { Label } from "./label";

interface TagInputProps {
	id?: string | undefined;
	label: string;
	value: string | undefined;
	onChange: (value: string | undefined) => void;
	disabled?: boolean | undefined;
	placeholder?: string | undefined;
	helpText?: string | undefined;
	maxTagLength?: number | undefined;
	maxTotalLength?: number | undefined;
	maxTags?: number | undefined;
	className?: string | undefined;
}

/**
 * Parse comma-separated tags string into Tag array
 */
function parseTags(tagString: string | undefined): Tag[] {
	if (!tagString || typeof tagString !== "string") return [];
	return tagString
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0)
		.map((text, index) => ({
			id: `tag-${index}-${text}`,
			text,
		}));
}

/**
 * Convert Tag array back to comma-separated string
 */
function stringifyTags(tags: Tag[]): string | undefined {
	const filtered = tags
		.map((tag) => tag.text.trim())
		.filter((text) => text.length > 0);
	return filtered.length > 0 ? filtered.join(", ") : undefined;
}

/**
 * Reusable component for managing comma-separated tags
 * Uses emblor for robust tag input handling with keyboard navigation,
 * accessibility, and proper tag management
 */
export function TagInput({
	id,
	label,
	value,
	onChange,
	disabled = false,
	placeholder = "Add a tag (Enter or comma)",
	helpText = "Press Enter or type a comma to add a tag",
	maxTagLength,
	maxTotalLength,
	maxTags,
	className,
}: TagInputProps) {
	const generatedId = useId();
	const inputId = id || generatedId;

	// Convert string value to Tag array
	const tags = useMemo(() => parseTags(value), [value]);

	// Track active tag for keyboard navigation
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

	// Handle tag changes from emblor
	const handleSetTags = useCallback(
		(newTags: Tag[] | ((prev: Tag[]) => Tag[])) => {
			const resolvedTags =
				typeof newTags === "function" ? newTags(tags) : newTags;

			// Check max total length if specified
			if (maxTotalLength) {
				const totalLength = stringifyTags(resolvedTags)?.length ?? 0;
				if (totalLength > maxTotalLength) {
					return; // Don't update if exceeds limit
				}
			}

			const stringValue = stringifyTags(resolvedTags);
			onChange(stringValue);
		},
		[tags, onChange, maxTotalLength],
	);

	// Custom tag validation
	const validateTag = useCallback(
		(tag: string): boolean => {
			const trimmed = tag.trim();
			if (!trimmed) return false;
			if (maxTagLength && trimmed.length > maxTagLength) return false;
			return true;
		},
		[maxTagLength],
	);

	return (
		<div data-slot="tag-input" className={cn("space-y-2", className)}>
			<Label htmlFor={inputId}>{label}</Label>
			<EmblorTagInput
				id={inputId}
				tags={tags}
				setTags={handleSetTags}
				activeTagIndex={activeTagIndex}
				setActiveTagIndex={setActiveTagIndex}
				placeholder={placeholder}
				disabled={disabled}
				maxTags={maxTags}
				maxLength={maxTagLength}
				validateTag={validateTag}
				delimiterList={[",", "Enter"]}
				styleClasses={{
					inlineTagsContainer:
						"flex min-h-[2.5rem] flex-wrap gap-2 rounded-md border border-input bg-transparent p-2 shadow-(--shadow-0) transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					tag: {
						body: "inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground",
						closeButton:
							"ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-ring",
					},
					input:
						"min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground sm:min-w-[200px]",
				}}
			/>
			{helpText && <p className="text-muted-foreground text-xs">{helpText}</p>}
		</div>
	);
}
