/**
 * Generic Share Bundle Dialog
 * Used by Calendar, Contacts, and Tasks apps
 */

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Check,
	Copy,
	ExternalLink,
	Layers,
	Loader2,
	Plus,
	Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../alert-dialog";
import { Badge } from "../badge";
import { Button, buttonVariants } from "../button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../dialog";
import { Input } from "../input";
import { Label } from "../label";
import { Switch } from "../switch";

export interface ShareBundle {
	id: string;
	name: string | null;
	token: string;
	itemCount: number;
	isActive: boolean;
	removeDuplicates: boolean;
	accessCount: number;
	lastAccessedAt: string | null;
	createdAt: string;
}

export interface SelectedItem {
	id: string;
	name: string;
	color: string | null;
	count: number;
}

interface BundleItemProps {
	bundle: ShareBundle;
	copiedId: string | null;
	getShareUrl: (token: string) => string;
	onCopy: (token: string, bundleId: string) => void;
	onToggleActive: (bundleId: string, isActive: boolean) => void;
	onDelete: (bundleId: string) => void;
	isDeleting: boolean;
}

function BundleItem({
	bundle,
	copiedId,
	getShareUrl,
	onCopy,
	onToggleActive,
	onDelete,
	isDeleting,
}: BundleItemProps) {
	return (
		<div className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							<Layers className="mr-1 h-3 w-3" />
							Bundle ({bundle.itemCount})
						</Badge>
						<span className="truncate font-medium text-small">
							{bundle.name || "Unnamed bundle"}
						</span>
						{!bundle.isActive && (
							<Badge variant="secondary" className="text-xs">
								Disabled
							</Badge>
						)}
						{bundle.removeDuplicates && (
							<Badge variant="outline" className="text-xs">
								No duplicates
							</Badge>
						)}
					</div>
					<div className="mt-1 flex items-center gap-2">
						<code className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs sm:max-w-[200px]">
							{getShareUrl(bundle.token)}
						</code>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 min-h-[44px] w-10 sm:h-6 sm:min-h-0 sm:w-6"
							onClick={() => onCopy(bundle.token, bundle.id)}
							aria-label={copiedId === bundle.id ? "Copied" : "Copy link"}
						>
							{copiedId === bundle.id ? (
								<Check className="h-4 w-4 text-green-500 sm:h-3 sm:w-3" />
							) : (
								<Copy className="h-4 w-4 sm:h-3 sm:w-3" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 min-h-[44px] w-10 sm:h-6 sm:min-h-0 sm:w-6"
							asChild
						>
							<a
								href={getShareUrl(bundle.token)}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Open share link in new tab"
							>
								<ExternalLink className="h-3 w-3" />
							</a>
						</Button>
					</div>
					<div className="mt-1.5 text-muted-foreground text-xs">
						{bundle.accessCount > 0
							? `${bundle.accessCount} access${bundle.accessCount !== 1 ? "es" : ""}`
							: "Never used"}
						{bundle.lastAccessedAt && (
							<>
								{" "}
								• Last access{" "}
								{format(new Date(bundle.lastAccessedAt), "MMM d 'at' HH:mm", {
									locale: enUS,
								})}
							</>
						)}
						<span className="ml-2 text-muted-foreground/70">
							Created on{" "}
							{format(new Date(bundle.createdAt), "MMM d, yyyy", {
								locale: enUS,
							})}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5">
						<Label htmlFor={`active-${bundle.id}`} className="sr-only">
							Enable/Disable
						</Label>
						<Switch
							id={`active-${bundle.id}`}
							checked={bundle.isActive}
							onCheckedChange={(checked) => {
								onToggleActive(bundle.id, checked);
							}}
						/>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={() => onDelete(bundle.id)}
						disabled={isDeleting}
						aria-label="Delete share link"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export interface ShareBundleDialogLabels {
	/** Entity name in singular form (e.g., "calendar", "address book", "task list") */
	entitySingular: string;
	/** Entity name in plural form (e.g., "calendars", "address books", "task lists") */
	entityPlural: string;
	/** Sub-item name (e.g., "events", "contacts", "tasks") */
	subItemPlural: string;
	/** File extension (e.g., ".ics", ".vcf") */
	fileExtension: string;
	/** Default color for items */
	defaultColor: string;
}

export interface ShareBundleDialogProps {
	/** Labels for the entity being shared */
	labels: ShareBundleDialogLabels;
	/** Selected item IDs */
	itemIds: string[];
	/** Whether the dialog is open */
	open: boolean;
	/** Callback when open state changes */
	onOpenChange: (open: boolean) => void;
	/** Optional group ID */
	groupId?: string | undefined;
	/** Selected items for display */
	selectedItems: SelectedItem[];
	/** Existing share bundles */
	shareBundles: ShareBundle[] | undefined;
	/** Whether bundles are loading */
	isLoading: boolean;
	/** Whether a create operation is pending */
	isCreating: boolean;
	/** Whether an update operation is pending */
	isUpdating: boolean;
	/** Whether a delete operation is pending */
	isDeleting: boolean;
	/** Callback when create is clicked */
	onCreate: (name: string, removeDuplicates: boolean) => void;
	/** Callback when toggle active is clicked */
	onToggleActive: (bundleId: string, isActive: boolean) => void;
	/** Callback when delete is confirmed */
	onDelete: (bundleId: string) => void;
	/** Render additional options (optional) */
	renderAdditionalOptions?: () => ReactNode;
}

export function ShareBundleDialog({
	labels,
	itemIds,
	open,
	onOpenChange,
	groupId: _groupId,
	selectedItems,
	shareBundles,
	isLoading,
	isCreating,
	isUpdating: _isUpdating,
	isDeleting,
	onCreate,
	onToggleActive,
	onDelete,
	renderAdditionalOptions,
}: ShareBundleDialogProps) {
	const [newBundleName, setNewBundleName] = useState("");
	const [removeDuplicates, setRemoveDuplicates] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [bundleIdToDelete, setBundleIdToDelete] = useState<string | null>(null);

	// Build share URL
	const getShareUrl = (token: string): string => {
		const baseUrl = window.location.origin;
		return `${baseUrl}/share/${token}`;
	};

	// Copy to clipboard
	const handleCopy = async (token: string, bundleId: string): Promise<void> => {
		const url = getShareUrl(token);
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(bundleId);
			setTimeout(() => setCopiedId(null), 2000);
			toast.success("Link copied!");
		} catch {
			toast.error("Unable to copy link");
		}
	};

	// Create new bundle
	const handleCreate = (): void => {
		onCreate(newBundleName.trim(), removeDuplicates);
		setNewBundleName("");
		setRemoveDuplicates(false);
	};

	// Delete bundle
	const handleDelete = (bundleId: string): void => {
		setBundleIdToDelete(bundleId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = (): void => {
		if (bundleIdToDelete) {
			onDelete(bundleIdToDelete);
			setDeleteDialogOpen(false);
			setBundleIdToDelete(null);
		}
	};

	// Generate default name
	const defaultName = `${itemIds.length} ${labels.entitySingular}${itemIds.length !== 1 ? "s" : ""} - ${format(new Date(), "MMM d, yyyy", { locale: enUS })}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Layers className="h-5 w-5" />
						Share {itemIds.length} {labels.entitySingular}
						{itemIds.length !== 1 ? "s" : ""}
					</DialogTitle>
					<DialogDescription>
						Create a sharing bundle to allow others to download these{" "}
						{labels.entityPlural} together in a single {labels.fileExtension}{" "}
						file
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Selected items list */}
					{selectedItems && selectedItems.length > 0 && (
						<div className="rounded-lg border bg-muted/30 p-3">
							<p className="mb-2 font-medium text-small">
								Selected {labels.entityPlural}:
							</p>
							<div className="space-y-1">
								{selectedItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-2 text-muted-foreground text-sm"
									>
										<div
											className="h-2 w-2 rounded-full"
											style={{
												backgroundColor: item.color || labels.defaultColor,
											}}
										/>
										<span>{item.name}</span>
										<span className="text-muted-foreground/60">
											({item.count} {labels.subItemPlural})
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Create new bundle */}
					<div className="space-y-3">
						<div className="flex gap-2">
							<Input
								placeholder={defaultName}
								value={newBundleName}
								onChange={(e) => setNewBundleName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreate()}
								className="flex-1"
							/>
							<Button
								onClick={handleCreate}
								disabled={isCreating || itemIds.length === 0}
								size="sm"
							>
								{isCreating ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
								<span className="ml-2 hidden sm:inline">Create</span>
							</Button>
						</div>

						{/* Remove duplicates option */}
						<div className="flex items-center justify-between rounded-lg border bg-card p-3">
							<div className="space-y-0.5">
								<Label htmlFor="remove-duplicates" className="text-sm">
									Remove duplicate {labels.subItemPlural}
								</Label>
								<p className="text-muted-foreground text-xs">
									Automatically remove duplicate {labels.subItemPlural} when
									merging {labels.entityPlural}
								</p>
							</div>
							<Switch
								id="remove-duplicates"
								checked={removeDuplicates}
								onCheckedChange={setRemoveDuplicates}
							/>
						</div>

						{renderAdditionalOptions?.()}

						{itemIds.length > 10 && (
							<p className="text-muted-foreground text-xs">
								Large bundle may take longer to generate
							</p>
						)}
					</div>

					<hr className="border-border" />

					{/* List of share bundles */}
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : shareBundles && shareBundles.length > 0 ? (
						<div className="space-y-3">
							{shareBundles.map((bundle) => (
								<BundleItem
									key={bundle.id}
									bundle={bundle}
									copiedId={copiedId}
									getShareUrl={getShareUrl}
									onCopy={handleCopy}
									onToggleActive={onToggleActive}
									onDelete={handleDelete}
									isDeleting={isDeleting}
								/>
							))}
						</div>
					) : (
						<div className="py-8 text-center text-muted-foreground text-sm">
							<Layers className="mx-auto mb-2 h-8 w-8 opacity-50" />
							<p>No sharing bundles</p>
							<p className="text-xs">
								Create a bundle to share these {labels.entityPlural}
							</p>
						</div>
					)}
				</div>
			</DialogContent>

			{/* Delete confirmation dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete sharing bundle?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this sharing bundle? This action
							is irreversible.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className={buttonVariants({ variant: "destructive" })}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
