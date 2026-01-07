/**
 * FileDropZone - Drag & drop zone for files
 * Built with react-dropzone for robust file handling
 */

import { cn } from "@appstandard/react-utils";
import { AlertCircle, CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
	type DropzoneOptions,
	type FileRejection,
	useDropzone,
} from "react-dropzone";
import { Button } from "./button";

export type DropState =
	| "idle"
	| "drag-over"
	| "processing"
	| "success"
	| "error";

export interface FileValidationResult {
	valid: boolean;
	error?: string | undefined;
}

export interface FileDropZoneProps {
	/** File extensions to accept (e.g., ".ics", ".vcf,.vcard") */
	accept?: string | undefined;
	/** Maximum file size in MB */
	maxSizeMB?: number | undefined;
	/** Text shown when idle (e.g., "Drag your .ics file here") */
	idleText?: string | undefined;
	/** Callback when file is selected */
	onFileSelect: (file: File) => void;
	/** Callback when file content is read */
	onFileContent?: ((content: string) => void) | undefined;
	/** Custom validation function for files */
	validateFile?: ((file: File) => FileValidationResult) | undefined;
	/** Custom content to show on success (receives file and reset function) */
	successContent?:
		| ((props: { file: File; onReset: () => void }) => ReactNode)
		| undefined;
	/** Preview content to render below the drop zone on success */
	previewContent?: ReactNode | undefined;
	/** Whether the drop zone is disabled */
	disabled?: boolean | undefined;
	/** Additional class name */
	className?: string | undefined;
}

function ProcessingContent() {
	return (
		<>
			<Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
			<p className="font-medium text-body-large">Reading file...</p>
		</>
	);
}

function DefaultSuccessContent({
	file,
	onReset,
}: {
	file: File;
	onReset: () => void;
}) {
	return (
		<>
			<CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
			<p className="font-medium text-body-large">{file.name}</p>
			<p className="mt-1 text-muted-foreground text-sm">
				File ready for import
			</p>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={(e) => {
					e.stopPropagation();
					onReset();
				}}
				className="mt-4"
			>
				<X className="mr-2 h-4 w-4" />
				Change file
			</Button>
		</>
	);
}

function ErrorContent({
	error,
	onReset,
}: {
	error: string;
	onReset: () => void;
}) {
	return (
		<>
			<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
			<p className="font-medium text-body-large text-destructive">{error}</p>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={(e) => {
					e.stopPropagation();
					onReset();
				}}
				className="mt-4"
			>
				Retry
			</Button>
		</>
	);
}

function IdleContent({
	isDragActive,
	maxSizeMB,
	idleText,
}: {
	isDragActive: boolean;
	maxSizeMB: number;
	idleText: string;
}) {
	return (
		<>
			<FileUp
				className={cn(
					"mb-4 h-12 w-12 transition-transform",
					isDragActive ? "scale-110 text-primary" : "text-muted-foreground",
				)}
			/>
			<p className="font-medium text-body-large">
				{isDragActive ? "Drop your file here" : idleText}
			</p>
			<p className="mt-1 text-muted-foreground text-sm">or click to browse</p>
			<p className="mt-4 text-muted-foreground/60 text-xs">
				Maximum size: {maxSizeMB}MB
			</p>
		</>
	);
}

/**
 * Convert accept string (e.g., ".ics,.vcf") to react-dropzone accept format
 */
function parseAcceptString(
	accept: string,
): DropzoneOptions["accept"] | undefined {
	if (!accept) return undefined;

	const extensions = accept.split(",").map((ext) => ext.trim().toLowerCase());
	const mimeTypes: Record<string, string[]> = {};

	for (const ext of extensions) {
		const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;

		// Map common extensions to MIME types
		const mimeMap: Record<string, string> = {
			".ics": "text/calendar",
			".vcf": "text/vcard",
			".vcard": "text/vcard",
			".csv": "text/csv",
			".json": "application/json",
			".txt": "text/plain",
			".xml": "application/xml",
			".pdf": "application/pdf",
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".gif": "image/gif",
			".webp": "image/webp",
			".svg": "image/svg+xml",
		};

		const mimeType = mimeMap[normalizedExt] || "application/octet-stream";
		if (!mimeTypes[mimeType]) {
			mimeTypes[mimeType] = [];
		}
		mimeTypes[mimeType].push(normalizedExt);
	}

	return mimeTypes;
}

export function FileDropZone({
	accept = ".ics",
	maxSizeMB = 5,
	idleText = "Drag your file here",
	onFileSelect,
	onFileContent,
	validateFile,
	successContent,
	previewContent,
	disabled = false,
	className,
}: FileDropZoneProps) {
	const [state, setState] = useState<DropState>("idle");
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);

	const maxSizeBytes = maxSizeMB * 1024 * 1024;

	const processFile = useCallback(
		async (selectedFile: File) => {
			setError(null);

			// Custom validation if provided
			if (validateFile) {
				const validation = validateFile(selectedFile);
				if (!validation.valid) {
					setError(validation.error || "Invalid file");
					setState("error");
					return;
				}
			}

			setState("processing");
			setFile(selectedFile);

			try {
				const content = await selectedFile.text();
				onFileContent?.(content);
				onFileSelect(selectedFile);
				setState("success");
			} catch {
				setError("Error reading file");
				setState("error");
			}
		},
		[validateFile, onFileContent, onFileSelect],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			// Handle rejected files
			if (rejectedFiles.length > 0) {
				const rejection = rejectedFiles[0];
				const errorCode = rejection?.errors[0]?.code;

				if (errorCode === "file-too-large") {
					setError(`File too large (max ${maxSizeMB}MB)`);
				} else if (errorCode === "file-invalid-type") {
					setError(`File must be in ${accept} format`);
				} else {
					setError(rejection?.errors[0]?.message || "Invalid file");
				}
				setState("error");
				return;
			}

			// Process accepted file
			const selectedFile = acceptedFiles[0];
			if (selectedFile) {
				processFile(selectedFile);
			}
		},
		[accept, maxSizeMB, processFile],
	);

	const handleReset = useCallback(() => {
		setFile(null);
		setError(null);
		setState("idle");
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: parseAcceptString(accept),
		maxSize: maxSizeBytes,
		maxFiles: 1,
		disabled: disabled || state === "processing",
		noClick: state === "success" || state === "error",
	});

	const renderContent = () => {
		if (state === "processing") {
			return <ProcessingContent />;
		}
		if (state === "success" && file) {
			if (successContent) {
				return successContent({ file, onReset: handleReset });
			}
			return <DefaultSuccessContent file={file} onReset={handleReset} />;
		}
		if (state === "error" && error) {
			return <ErrorContent error={error} onReset={handleReset} />;
		}
		return (
			<IdleContent
				isDragActive={isDragActive}
				maxSizeMB={maxSizeMB}
				idleText={idleText}
			/>
		);
	};

	const containerClassName = cn(
		"relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-8",
		"cursor-pointer hover:border-primary/50 hover:bg-primary/5",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		state === "idle" && !isDragActive && "border-muted-foreground/25",
		isDragActive && "scale-[1.02] border-primary bg-primary/10",
		state === "processing" && "border-primary/50 bg-primary/5",
		state === "success" && "border-green-500/50 bg-green-500/5",
		state === "error" && "border-destructive/50 bg-destructive/5",
		disabled && "cursor-not-allowed opacity-50",
	);

	return (
		<div className={cn("space-y-4", className)}>
			<div
				{...getRootProps()}
				data-slot="file-drop-zone"
				className={containerClassName}
			>
				<input {...getInputProps()} aria-label="Select a file" />
				{renderContent()}
			</div>

			{state === "success" && previewContent}
		</div>
	);
}
