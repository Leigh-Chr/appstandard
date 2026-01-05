/**
 * FileDropZone - Generic drag & drop zone for files
 * Supports drag & drop and click to select with customizable validation
 */

import { cn } from "@appstandard/react-utils";
import { AlertCircle, CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
	isDragOver,
	maxSizeMB,
	idleText,
}: {
	isDragOver: boolean;
	maxSizeMB: number;
	idleText: string;
}) {
	return (
		<>
			<FileUp
				className={cn(
					"mb-4 h-12 w-12 transition-transform",
					isDragOver ? "scale-110 text-primary" : "text-muted-foreground",
				)}
			/>
			<p className="font-medium text-body-large">
				{isDragOver ? "Drop your file here" : idleText}
			</p>
			<p className="mt-1 text-muted-foreground text-sm">or click to browse</p>
			<p className="mt-4 text-muted-foreground/60 text-xs">
				Maximum size: {maxSizeMB}MB
			</p>
		</>
	);
}

function defaultValidateFile(
	file: File,
	accept: string,
	maxSizeMB: number,
): FileValidationResult {
	// Validate extension
	const extension = file.name.split(".").pop()?.toLowerCase();
	const acceptedExtensions = accept
		.split(",")
		.map((ext) => ext.trim().replace(".", "").toLowerCase());

	if (extension && !acceptedExtensions.includes(extension)) {
		return {
			valid: false,
			error: `File must be in ${accept} format`,
		};
	}

	// Validate size
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	if (file.size > maxSizeBytes) {
		return {
			valid: false,
			error: `File too large (max ${maxSizeMB}MB). Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
		};
	}

	return { valid: true };
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
	const inputRef = useRef<HTMLInputElement>(null);
	const dragCountRef = useRef(0);

	const processFile = async (selectedFile: File) => {
		setError(null);

		// Validate file
		const validation = validateFile
			? validateFile(selectedFile)
			: defaultValidateFile(selectedFile, accept, maxSizeMB);

		if (!validation.valid) {
			setError(validation.error || "Invalid file");
			setState("error");
			return;
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
	};

	const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (disabled) return;

		dragCountRef.current++;
		if (e.dataTransfer.types.includes("Files")) {
			setState("drag-over");
		}
	};

	const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (disabled) return;

		dragCountRef.current--;
		if (dragCountRef.current === 0) {
			setState((prev) => (prev === "drag-over" ? "idle" : prev));
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		dragCountRef.current = 0;

		if (disabled) return;

		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) {
			processFile(droppedFile);
		} else {
			setState("idle");
		}
	};

	const handleClick = () => {
		if (!disabled) {
			inputRef.current?.click();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			processFile(selectedFile);
		}
	};

	const handleReset = () => {
		setFile(null);
		setError(null);
		setState("idle");
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	useEffect(() => {
		return () => {
			dragCountRef.current = 0;
		};
	}, []);

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
				isDragOver={state === "drag-over"}
				maxSizeMB={maxSizeMB}
				idleText={idleText}
			/>
		);
	};

	const buttonClassName = cn(
		"relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-8",
		"cursor-pointer hover:border-primary/50 hover:bg-primary/5",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		state === "idle" && "border-muted-foreground/25",
		state === "drag-over" && "scale-[1.02] border-primary bg-primary/10",
		state === "processing" && "border-primary/50 bg-primary/5",
		state === "success" && "border-green-500/50 bg-green-500/5",
		state === "error" && "border-destructive/50 bg-destructive/5",
		disabled && "cursor-not-allowed opacity-50",
	);

	return (
		<div className={cn("space-y-4", className)}>
			<button
				type="button"
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={handleClick}
				disabled={disabled}
				className={buttonClassName}
			>
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					onChange={handleInputChange}
					disabled={disabled}
					className="hidden"
					aria-label="Select a file"
				/>
				{renderContent()}
			</button>

			{state === "success" && previewContent}
		</div>
	);
}
