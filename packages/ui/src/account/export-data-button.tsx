/**
 * Export Data Button Component
 * Generic button to export user data with customizable filename
 */

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../button";

function getErrorMessage(error: unknown): string {
	// Handle tRPC errors specifically
	// tRPC errors have structure: { data: { code: string, ... }, message: string }
	if (
		error &&
		typeof error === "object" &&
		"data" in error &&
		error.data &&
		typeof error.data === "object" &&
		"code" in error.data
	) {
		const errorCode = error.data.code as string;
		if (errorCode === "TOO_MANY_REQUESTS") {
			return "Too many export requests. Please wait before trying again.";
		}
		if (errorCode === "UNAUTHORIZED") {
			return "You must be authenticated to export your data.";
		}
		if ("message" in error && typeof error.message === "string") {
			return error.message;
		}
	}
	if (error instanceof Error) {
		return error.message || "Failed to export your data. Please try again.";
	}
	return "Failed to export your data. Please try again.";
}

export interface ExportDataButtonProps {
	/** Function to fetch the export data */
	exportFn: () => Promise<unknown>;
	/** Prefix for the downloaded filename (e.g., "appstandard-calendar") */
	filenamePrefix?: string | undefined;
	/** Button label when idle */
	idleLabel?: string | undefined;
	/** Button label when exporting */
	loadingLabel?: string | undefined;
	/** Success toast message */
	successMessage?: string | undefined;
}

export function ExportDataButton({
	exportFn,
	filenamePrefix = "appstandard-export",
	idleLabel = "Export my data",
	loadingLabel = "Exporting...",
	successMessage = "Your data has been exported successfully!",
}: ExportDataButtonProps) {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const data = await exportFn();
			if (data) {
				// Create a blob with the JSON data
				const jsonString = JSON.stringify(data, null, 2);
				const blob = new Blob([jsonString], { type: "application/json" });
				const url = URL.createObjectURL(blob);

				// Create a temporary link and trigger download
				const link = document.createElement("a");
				link.href = url;
				link.download = `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.json`;
				document.body.appendChild(link);
				link.click();

				// Cleanup
				document.body.removeChild(link);
				URL.revokeObjectURL(url);

				toast.success(successMessage);
			}
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			toast.error(errorMessage);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant="outline"
			onClick={handleExport}
			disabled={isExporting}
			className="w-full"
		>
			<Download className="mr-2 h-4 w-4" />
			{isExporting ? loadingLabel : idleLabel}
		</Button>
	);
}
