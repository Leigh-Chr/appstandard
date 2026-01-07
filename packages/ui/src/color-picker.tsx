/**
 * ColorPicker - Color selection component
 * Built with react-colorful for accessible, lightweight color picking
 */

import { cn } from "@appstandard/react-utils";
import { Check, Palette } from "lucide-react";
import { useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const PREDEFINED_COLORS = [
	{ name: "Solar Yellow", value: "#D4A017" },
	{ name: "Orange", value: "#F97316" },
	{ name: "Red", value: "#EF4444" },
	{ name: "Yellow", value: "#EAB308" },
	{ name: "Green", value: "#22C55E" },
	{ name: "Blue", value: "#3B82F6" },
	{ name: "Purple", value: "#8B5CF6" },
	{ name: "Pink", value: "#EC4899" },
	{ name: "Cyan", value: "#06B6D4" },
	{ name: "Gray", value: "#6B7280" },
];

interface ColorPickerProps {
	value?: string | null;
	onChange: (color: string | null) => void;
	disabled?: boolean;
	showInput?: boolean;
	label?: string;
}

/**
 * Color picker component with predefined colors and full spectrum picker
 * Uses react-colorful for the color spectrum picker
 */
export function ColorPicker({
	value,
	onChange,
	disabled,
	showInput = true,
	label = "Color",
}: ColorPickerProps) {
	const [open, setOpen] = useState(false);

	const handleColorChange = useCallback(
		(color: string) => {
			onChange(color.toUpperCase());
		},
		[onChange],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value.toUpperCase();
			if (val === "" || /^#[0-9A-F]{0,6}$/i.test(val)) {
				onChange(val || null);
			}
		},
		[onChange],
	);

	return (
		<div className="space-y-2">
			{label && <Label>{label}</Label>}
			<div className="flex flex-wrap gap-2">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-auto"
							disabled={disabled}
							aria-label="Select a color"
						>
							{value ? (
								<div
									className="mr-2 h-4 w-4 rounded-full border"
									style={{ backgroundColor: value }}
								/>
							) : (
								<Palette className="mr-2 h-4 w-4" />
							)}
							{value || "Color"}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[calc(100vw-2rem)] max-w-xs p-4 sm:w-64"
						align="start"
					>
						<div className="space-y-4">
							{/* Predefined colors */}
							<div className="space-y-2">
								<Label className="font-medium text-xs">Predefined colors</Label>
								<div className="grid grid-cols-5 gap-2">
									{PREDEFINED_COLORS.map((color) => (
										<button
											key={color.value}
											type="button"
											onClick={() => {
												onChange(color.value);
												setOpen(false);
											}}
											disabled={disabled}
											className={cn(
												"h-8 w-8 rounded-md border-2 transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
												value === color.value
													? "border-foreground ring-2 ring-offset-2"
													: "border-muted",
											)}
											style={{ backgroundColor: color.value }}
											aria-label={color.name}
											title={color.name}
										>
											{value === color.value && (
												<Check className="m-auto h-4 w-4 text-white drop-shadow-md" />
											)}
										</button>
									))}
								</div>
							</div>

							{/* Full spectrum picker */}
							<div className="space-y-2">
								<Label className="font-medium text-xs">Custom color</Label>
								<HexColorPicker
									color={value || "#3B82F6"}
									onChange={handleColorChange}
									className="!w-full"
								/>
							</div>

							{/* Hex input */}
							<div className="flex items-center gap-2">
								<div
									className="h-9 w-9 shrink-0 rounded-md border"
									style={{ backgroundColor: value || "#3B82F6" }}
								/>
								<Input
									value={value || ""}
									onChange={handleInputChange}
									disabled={disabled}
									placeholder="#3B82F6"
									className="font-mono text-sm"
									aria-label="Hexadecimal color code"
								/>
							</div>

							{/* Clear button */}
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={() => {
									onChange(null);
									setOpen(false);
								}}
							>
								No color
							</Button>
						</div>
					</PopoverContent>
				</Popover>

				{showInput && (
					<Input
						value={value || ""}
						onChange={handleInputChange}
						disabled={disabled}
						placeholder="#3B82F6"
						className="w-24 font-mono"
						aria-label="Hexadecimal color code"
					/>
				)}
			</div>
		</div>
	);
}

/**
 * Compact color indicator for displaying calendar color
 */
export function ColorIndicator({
	color,
	size = "md",
	className,
}: {
	color?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	if (!color) return null;

	const sizeClasses = {
		sm: "h-3 w-3",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};

	return (
		<div
			data-slot="color-indicator"
			className={cn(
				"rounded-full border border-border/50",
				sizeClasses[size],
				className,
			)}
			style={{ backgroundColor: color }}
			title={`Color: ${color}`}
			role="img"
			aria-label={`Color: ${color}`}
		/>
	);
}
