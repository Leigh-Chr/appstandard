/**
 * Attachments section for task form
 * Add/remove attachments by URL
 */

import { Button, Input, Label } from "@appstandard/ui";
import { FileIcon, Link2, Plus, Trash2 } from "lucide-react";

interface AttachmentData {
	uri?: string;
	filename?: string;
}

interface AttachmentsSectionProps {
	attachments: AttachmentData[];
	onAddAttachment: () => void;
	onRemoveAttachment: (index: number) => void;
	onUpdateAttachment: (index: number, data: Partial<AttachmentData>) => void;
	isSubmitting: boolean;
}

/**
 * Get file icon based on URL extension
 */
function getFileIcon(url?: string): string {
	if (!url) return "file";
	const ext = url.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
			return "pdf";
		case "doc":
		case "docx":
			return "word";
		case "xls":
		case "xlsx":
			return "excel";
		case "ppt":
		case "pptx":
			return "powerpoint";
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "webp":
			return "image";
		case "mp4":
		case "mov":
		case "avi":
			return "video";
		case "mp3":
		case "wav":
			return "audio";
		case "zip":
		case "rar":
		case "7z":
			return "archive";
		default:
			return "file";
	}
}

export function AttachmentsSection({
	attachments,
	onAddAttachment,
	onRemoveAttachment,
	onUpdateAttachment,
	isSubmitting,
}: AttachmentsSectionProps) {
	return (
		<div className="space-y-4">
			{attachments.length === 0 ? (
				<p className="text-muted-foreground text-sm">No attachments added.</p>
			) : (
				<div className="space-y-3">
					{attachments.map((attachment, index) => (
						<div
							key={index}
							className="space-y-3 rounded-lg border bg-card p-4"
						>
							{/* URL input */}
							<div className="flex items-start gap-3">
								<FileIcon className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
								<div className="flex-1 space-y-2">
									<Label htmlFor={`attachment-uri-${index}`}>URL</Label>
									<Input
										id={`attachment-uri-${index}`}
										type="url"
										value={attachment.uri || ""}
										onChange={(e) =>
											onUpdateAttachment(index, { uri: e.target.value })
										}
										placeholder="https://example.com/file.pdf"
										disabled={isSubmitting}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onRemoveAttachment(index)}
									disabled={isSubmitting}
									className="mt-6 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>

							{/* Filename input (optional) */}
							<div className="ml-8 space-y-2">
								<Label htmlFor={`attachment-filename-${index}`}>
									Display Name (optional)
								</Label>
								<Input
									id={`attachment-filename-${index}`}
									value={attachment.filename || ""}
									onChange={(e) =>
										onUpdateAttachment(index, { filename: e.target.value })
									}
									placeholder="My Document.pdf"
									disabled={isSubmitting}
								/>
							</div>

							{/* Preview if URL is set */}
							{attachment.uri && (
								<div className="ml-8 text-muted-foreground text-sm">
									<a
										href={attachment.uri}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 hover:text-primary"
									>
										<Link2 className="h-3 w-3" />
										{attachment.filename || attachment.uri}
									</a>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Add button */}
			<Button
				type="button"
				variant="outline"
				onClick={onAddAttachment}
				disabled={isSubmitting}
				className="w-full"
			>
				<Plus className="mr-2 h-4 w-4" />
				Add Attachment
			</Button>
		</div>
	);
}
