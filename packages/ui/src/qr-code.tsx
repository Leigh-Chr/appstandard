/**
 * QR Code Components
 * Shared QR code display and dialog for sharing links and data
 */

import { cn } from "@appstandard/react-utils";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./dialog";

// ============================================================================
// QR Code Display Component
// ============================================================================

export interface QRCodeDisplayProps {
	/** The value to encode in the QR code (URL or data) */
	value: string;
	/** Size of the QR code in pixels */
	size?: number;
	/** Title displayed below the QR code */
	title?: string;
	/** Description displayed below the title */
	description?: string;
	/** Additional CSS classes */
	className?: string;
	/** Whether to show the copy button */
	showCopyButton?: boolean;
	/** Whether to show the download button */
	showDownloadButton?: boolean;
	/** Filename for download (without extension) */
	downloadFilename?: string;
	/** Background color of the QR code */
	bgColor?: string;
	/** Foreground color of the QR code */
	fgColor?: string;
	/** Error correction level */
	level?: "L" | "M" | "Q" | "H";
}

export function QRCodeDisplay({
	value,
	size = 200,
	title,
	description,
	className,
	showCopyButton = true,
	showDownloadButton = true,
	downloadFilename = "qr-code",
	bgColor = "#ffffff",
	fgColor = "#000000",
	level = "M",
}: QRCodeDisplayProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [copied, setCopied] = useState(false);

	// Copy the URL/value to clipboard
	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success("Link copied!");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	}, [value]);

	// Download QR code as PNG
	const handleDownload = useCallback(() => {
		const svg = svgRef.current;
		if (!svg) return;

		// Create a canvas to draw the SVG
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size with padding
		const padding = 20;
		canvas.width = size + padding * 2;
		canvas.height = size + padding * 2;

		// Fill background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Convert SVG to data URL
		const svgData = new XMLSerializer().serializeToString(svg);
		const svgBlob = new Blob([svgData], {
			type: "image/svg+xml;charset=utf-8",
		});
		const svgUrl = URL.createObjectURL(svgBlob);

		// Create image and draw to canvas
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, padding, padding, size, size);
			URL.revokeObjectURL(svgUrl);

			// Download
			const pngUrl = canvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.href = pngUrl;
			a.download = `${downloadFilename}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			toast.success("QR code downloaded");
		};
		img.src = svgUrl;
	}, [size, bgColor, downloadFilename]);

	return (
		<div className={cn("flex flex-col items-center gap-4", className)}>
			{/* QR Code */}
			<div className="rounded-xl border bg-white p-4 shadow-sm">
				<QRCodeSVG
					ref={svgRef}
					value={value}
					size={size}
					bgColor={bgColor}
					fgColor={fgColor}
					level={level}
					marginSize={0}
				/>
			</div>

			{/* Title and description */}
			{(title || description) && (
				<div className="text-center">
					{title && (
						<p className="font-medium text-foreground text-sm">{title}</p>
					)}
					{description && (
						<p className="mt-0.5 text-muted-foreground text-xs">
							{description}
						</p>
					)}
				</div>
			)}

			{/* Action buttons */}
			{(showCopyButton || showDownloadButton) && (
				<div className="flex gap-2">
					{showCopyButton && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
							className="gap-2"
						>
							{copied ? (
								<Check className="h-4 w-4 text-green-500" />
							) : (
								<Copy className="h-4 w-4" />
							)}
							{copied ? "Copied!" : "Copy link"}
						</Button>
					)}
					{showDownloadButton && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
							className="gap-2"
						>
							<Download className="h-4 w-4" />
							Download
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// QR Code Dialog Component
// ============================================================================

export interface QRCodeDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Callback when the dialog open state changes */
	onOpenChange: (open: boolean) => void;
	/** The value to encode in the QR code (URL or direct data) */
	value: string;
	/** Dialog title */
	title?: string;
	/** Dialog description */
	description?: string;
	/** Label for the QR code content */
	contentLabel?: string;
	/** Size of the QR code in pixels */
	size?: number;
	/** Filename for download (without extension) */
	downloadFilename?: string;
}

export function QRCodeDialog({
	open,
	onOpenChange,
	value,
	title = "QR Code",
	description = "Scan this QR code to access the shared content",
	contentLabel,
	size = 200,
	downloadFilename = "qr-code",
}: QRCodeDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<QrCode className="h-5 w-5" />
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<QRCodeDisplay
					value={value}
					size={size}
					title={contentLabel}
					downloadFilename={downloadFilename}
					showCopyButton
					showDownloadButton
				/>
			</DialogContent>
		</Dialog>
	);
}

// ============================================================================
// QR Code Button Component (for triggering the dialog)
// ============================================================================

export interface QRCodeButtonProps {
	/** The value to encode in the QR code */
	value: string;
	/** Dialog title */
	title?: string;
	/** Dialog description */
	description?: string;
	/** Label for the QR code content */
	contentLabel?: string;
	/** Filename for download */
	downloadFilename?: string;
	/** Button variant */
	variant?: "default" | "outline" | "ghost" | "secondary";
	/** Button size */
	buttonSize?: "default" | "sm" | "icon";
	/** Additional button classes */
	className?: string;
	/** Button aria-label */
	"aria-label"?: string;
}

export function QRCodeButton({
	value,
	title,
	description,
	contentLabel,
	downloadFilename,
	variant = "ghost",
	buttonSize = "icon",
	className,
	"aria-label": ariaLabel = "Show QR code",
}: QRCodeButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				variant={variant}
				size={buttonSize}
				onClick={() => setOpen(true)}
				className={cn(
					buttonSize === "icon" &&
						"h-10 min-h-[44px] w-10 sm:h-6 sm:min-h-0 sm:w-6",
					className,
				)}
				aria-label={ariaLabel}
			>
				<QrCode className="h-4 w-4 sm:h-3 sm:w-3" />
			</Button>

			<QRCodeDialog
				open={open}
				onOpenChange={setOpen}
				value={value}
				title={title}
				description={description}
				contentLabel={contentLabel}
				downloadFilename={downloadFilename}
			/>
		</>
	);
}
