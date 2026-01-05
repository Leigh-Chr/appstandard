/**
 * Export Address Book Dialog - Export with optional filters
 * Allows exporting address book as vCard with category filters
 */

import {
	Badge,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

interface ExportAddressBookDialogProps {
	addressBookId: string;
	addressBookName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ExportAddressBookDialog({
	addressBookId,
	addressBookName,
	open,
	onOpenChange,
}: ExportAddressBookDialogProps) {
	const [isExporting, setIsExporting] = useState(false);
	const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
		new Set(),
	);
	const [withEmailOnly, setWithEmailOnly] = useState(false);
	const [withPhoneOnly, setWithPhoneOnly] = useState(false);

	// Get unique categories from address book
	const { data: availableCategories = [] } = useQuery({
		queryKey: ["addressBook", "categories", addressBookId],
		queryFn: async () => {
			return trpcClient.addressBook.getCategories.query({ id: addressBookId });
		},
		enabled: open,
	});

	// Toggle category selection
	const toggleCategory = (category: string) => {
		setSelectedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(category)) {
				next.delete(category);
			} else {
				next.add(category);
			}
			return next;
		});
	};

	// Export handler
	const handleExport = async () => {
		setIsExporting(true);
		try {
			const data = await trpcClient.addressBook.exportVCard.query({
				id: addressBookId,
				categories:
					selectedCategories.size > 0
						? Array.from(selectedCategories)
						: undefined,
				withEmailOnly: withEmailOnly || undefined,
				withPhoneOnly: withPhoneOnly || undefined,
			});

			// Download the vCard file
			const blob = new Blob([data.vcardContent], { type: "text/vcard" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;

			// Build filename with filters info
			let filename = data.addressBookName;
			if (withEmailOnly) filename += "_with-email";
			if (withPhoneOnly) filename += "_with-phone";
			if (selectedCategories.size > 0) filename += "_filtered";
			filename += ".vcf";

			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Address book exported successfully");
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error during export";
			toast.error(message);
		} finally {
			setIsExporting(false);
		}
	};

	// Quick export (no filters)
	const handleQuickExport = async () => {
		setIsExporting(true);
		try {
			const data = await trpcClient.addressBook.exportVCard.query({
				id: addressBookId,
			});

			const blob = new Blob([data.vcardContent], { type: "text/vcard" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${data.addressBookName}.vcf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Address book exported successfully");
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error during export";
			toast.error(message);
		} finally {
			setIsExporting(false);
		}
	};

	// Clear all filters
	const clearFilters = () => {
		setSelectedCategories(new Set());
		setWithEmailOnly(false);
		setWithPhoneOnly(false);
	};

	const hasFilters =
		selectedCategories.size > 0 || withEmailOnly || withPhoneOnly;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="h-5 w-5" />
						Export "{addressBookName}"
					</DialogTitle>
					<DialogDescription>
						Export the entire address book or apply filters to export only
						specific contacts.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Quick export button */}
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={handleQuickExport}
						disabled={isExporting}
					>
						{isExporting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Export all contacts
					</Button>

					<div className="flex items-center gap-2">
						<div className="h-px flex-1 bg-border" />
						<span className="text-muted-foreground text-xs">or</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					{/* Filters section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label className="flex items-center gap-2 font-medium text-sm">
								<Filter className="h-4 w-4" />
								Filters
							</Label>
							{hasFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="h-auto px-2 py-1 text-xs"
								>
									Clear filters
								</Button>
							)}
						</div>

						{/* Contact completeness filters */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Checkbox
									id="with-email"
									checked={withEmailOnly}
									onCheckedChange={(checked) =>
										setWithEmailOnly(checked === true)
									}
								/>
								<Label htmlFor="with-email" className="text-sm">
									Only contacts with email
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="with-phone"
									checked={withPhoneOnly}
									onCheckedChange={(checked) =>
										setWithPhoneOnly(checked === true)
									}
								/>
								<Label htmlFor="with-phone" className="text-sm">
									Only contacts with phone
								</Label>
							</div>
						</div>

						{/* Categories filter */}
						{availableCategories.length > 0 && (
							<div className="space-y-2">
								<Label className="text-sm">Categories</Label>
								<div className="flex flex-wrap gap-2">
									{availableCategories.map((category) => (
										<Badge
											key={category}
											variant={
												selectedCategories.has(category) ? "default" : "outline"
											}
											className="min-h-[44px] cursor-pointer px-3 py-2 sm:min-h-0 sm:px-2 sm:py-0.5"
											onClick={() => toggleCategory(category)}
										>
											{category}
										</Badge>
									))}
								</div>
								{selectedCategories.size > 0 && (
									<p className="text-muted-foreground text-xs">
										{selectedCategories.size} categor
										{selectedCategories.size !== 1 ? "ies" : "y"} selected
									</p>
								)}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleExport} disabled={isExporting || !hasFilters}>
						{isExporting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Exporting...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Export with filters
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
