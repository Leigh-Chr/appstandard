/**
 * Additional info section for task form
 * Location, URL, categories, color
 */

import { Badge, Input, Label } from "@appstandard/ui";
import { Globe, MapPin, Palette, Tag } from "lucide-react";

interface AdditionalInfoSectionProps {
	location: string;
	url: string;
	categories: string;
	color: string;
	onLocationChange: (value: string) => void;
	onUrlChange: (value: string) => void;
	onCategoriesChange: (value: string) => void;
	onColorChange: (value: string) => void;
	validationErrors?: { url?: string };
	isSubmitting: boolean;
}

export function AdditionalInfoSection({
	location,
	url,
	categories,
	color,
	onLocationChange,
	onUrlChange,
	onCategoriesChange,
	onColorChange,
	validationErrors,
	isSubmitting,
}: AdditionalInfoSectionProps) {
	const categoryList = categories
		.split(",")
		.map((c) => c.trim())
		.filter(Boolean);

	return (
		<div className="space-y-4">
			{/* Location */}
			<div className="space-y-2">
				<Label htmlFor="location" className="flex items-center gap-2">
					<MapPin className="h-4 w-4" />
					Location
				</Label>
				<Input
					id="location"
					value={location}
					onChange={(e) => onLocationChange(e.target.value)}
					placeholder="Add a location..."
					disabled={isSubmitting}
				/>
			</div>

			{/* URL */}
			<div className="space-y-2">
				<Label htmlFor="url" className="flex items-center gap-2">
					<Globe className="h-4 w-4" />
					URL
				</Label>
				<Input
					id="url"
					type="url"
					value={url}
					onChange={(e) => onUrlChange(e.target.value)}
					placeholder="https://..."
					disabled={isSubmitting}
					className={validationErrors?.url ? "border-destructive" : ""}
				/>
				{validationErrors?.url && (
					<p className="text-destructive text-sm">{validationErrors.url}</p>
				)}
			</div>

			{/* Categories */}
			<div className="space-y-2">
				<Label htmlFor="categories" className="flex items-center gap-2">
					<Tag className="h-4 w-4" />
					Categories
				</Label>
				<Input
					id="categories"
					value={categories}
					onChange={(e) => onCategoriesChange(e.target.value)}
					placeholder="work, personal, urgent (comma-separated)"
					disabled={isSubmitting}
				/>
				{categoryList.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{categoryList.map((cat) => (
							<Badge key={cat} variant="secondary">
								{cat}
							</Badge>
						))}
					</div>
				)}
			</div>

			{/* Color */}
			<div className="space-y-2">
				<Label htmlFor="color" className="flex items-center gap-2">
					<Palette className="h-4 w-4" />
					Color
				</Label>
				<div className="flex items-center gap-2">
					<input
						id="color"
						type="color"
						value={color}
						onChange={(e) => onColorChange(e.target.value)}
						className="h-10 w-20 cursor-pointer rounded border"
						disabled={isSubmitting}
					/>
					<span className="text-muted-foreground text-sm">{color}</span>
				</div>
			</div>
		</div>
	);
}
