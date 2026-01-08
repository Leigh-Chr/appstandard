/**
 * File Handler hook for PWA
 * Handles files opened with the app via file_handlers manifest
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API
 */

import { useEffect, useRef } from "react";

export interface FileHandlerOptions {
	/** Callback when files are received */
	onFiles: (files: File[]) => void | Promise<void>;
	/** Whether to process files immediately on mount (default: true) */
	immediate?: boolean;
}

// Extend Window interface for Launch Queue API
interface LaunchParams {
	files?: FileSystemFileHandle[];
	targetURL?: string;
}

interface LaunchQueue {
	setConsumer(consumer: (params: LaunchParams) => void): void;
}

declare global {
	interface Window {
		launchQueue?: LaunchQueue;
	}
}

/**
 * Hook to handle files opened with the app
 *
 * When a user double-clicks a .ics file and your PWA is set as the handler,
 * this hook will receive the file and call your callback.
 *
 * @example
 * ```tsx
 * function ImportPage() {
 *   const [files, setFiles] = useState<File[]>([]);
 *
 *   useFileHandler({
 *     onFiles: async (receivedFiles) => {
 *       setFiles(receivedFiles);
 *       // Process the files
 *       for (const file of receivedFiles) {
 *         const content = await file.text();
 *         await importCalendar(content);
 *       }
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       {files.length > 0 && <p>Processing {files.length} files...</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileHandler(options: FileHandlerOptions): void {
	const { onFiles, immediate = true } = options;
	const onFilesRef = useRef(onFiles);

	// Keep callback ref updated
	useEffect(() => {
		onFilesRef.current = onFiles;
	}, [onFiles]);

	useEffect(() => {
		// Check if Launch Queue API is supported
		if (!("launchQueue" in window) || !window.launchQueue) {
			return;
		}

		const processFiles = async (fileHandles: FileSystemFileHandle[]) => {
			const files: File[] = [];

			for (const handle of fileHandles) {
				try {
					const file = await handle.getFile();
					files.push(file);
				} catch (error) {
					console.error("Failed to get file from handle:", error);
				}
			}

			if (files.length > 0) {
				await onFilesRef.current(files);
			}
		};

		if (immediate) {
			window.launchQueue.setConsumer((launchParams: LaunchParams) => {
				if (launchParams.files && launchParams.files.length > 0) {
					processFiles(launchParams.files);
				}
			});
		}
	}, [immediate]);
}

/**
 * Check if File Handler API is supported
 */
export function isFileHandlerSupported(): boolean {
	return typeof window !== "undefined" && "launchQueue" in window;
}

/**
 * Read file content as text
 * Utility function for processing text-based files like .ics, .vcf
 */
export async function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}

/**
 * Read multiple files as text
 */
export async function readFilesAsText(files: File[]): Promise<string[]> {
	return Promise.all(files.map(readFileAsText));
}
