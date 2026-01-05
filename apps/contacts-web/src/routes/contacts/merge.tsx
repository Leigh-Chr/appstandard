import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Merge } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddressBooks } from "@/hooks/use-address-books";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/contacts/merge")({
	component: MergeAddressBooksComponent,
	head: () => ({
		meta: [
			{ title: "Merge address books - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Merge multiple address books into one with automatic duplicate detection.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function MergeAddressBooksComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { addressBooks } = useAddressBooks();

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [mergedName, setMergedName] = useState("");
	const [removeDuplicates, setRemoveDuplicates] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");

	// Filter address books by search keyword
	const filteredAddressBooks = (() => {
		const booksArray = Array.isArray(addressBooks) ? addressBooks : [];
		if (!searchKeyword.trim()) {
			return booksArray;
		}
		const searchLower = searchKeyword.trim().toLowerCase();
		return booksArray.filter((book) =>
			book.name.toLowerCase().includes(searchLower),
		);
	})();

	const mergeMutation = useMutation({
		mutationFn: (data: {
			addressBookIds: string[];
			name: string;
			removeDuplicates: boolean;
		}) => trpcClient.merge.merge.mutate(data),
		onSuccess: (data) => {
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.addressBook.list,
			});
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact.all });
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.dashboard.all,
			});
			toast.success(
				`Address books merged! ${data.mergedContacts} contact(s), ${data.removedDuplicates} duplicate(s) removed.`,
			);
			navigate({ to: `/contacts/${data.addressBook.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during merge";
			toast.error(message);
		},
	});

	const handleToggle = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const handleMerge = () => {
		if (selectedIds.size < 2) {
			toast.error("Select at least 2 address books to merge");
			return;
		}

		if (!mergedName.trim()) {
			toast.error("Please enter a name for the merged address book");
			return;
		}

		mergeMutation.mutate({
			addressBookIds: Array.from(selectedIds),
			name: mergedName.trim(),
			removeDuplicates,
		});
	};

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="transition-all duration-200 hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Merge className="h-5 w-5" />
							Merge address books
						</CardTitle>
						<CardDescription>
							Combine multiple address books into one
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Select address books to merge (minimum 2)</Label>
							{addressBooks && addressBooks.length > 3 && (
								<div className="mb-2">
									<Input
										placeholder="Search address books..."
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										aria-label="Search address books to merge"
									/>
								</div>
							)}
							<div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
								{!addressBooks || addressBooks.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No address books available
									</p>
								) : filteredAddressBooks.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No address books match your search
									</p>
								) : (
									filteredAddressBooks.map((book) => (
										<div
											key={book.id}
											className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent"
										>
											<Checkbox
												id={book.id}
												checked={selectedIds.has(book.id)}
												onCheckedChange={() => handleToggle(book.id)}
											/>
											<label
												htmlFor={book.id}
												className="flex-1 cursor-pointer text-sm"
											>
												{book.name} ({book.contactCount ?? 0} contact
												{(book.contactCount ?? 0) !== 1 ? "s" : ""})
											</label>
										</div>
									))
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mergedName">Merged address book name</Label>
							<Input
								id="mergedName"
								value={mergedName}
								onChange={(e) => setMergedName(e.target.value)}
								placeholder="Merged contacts"
								disabled={mergeMutation.isPending}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="removeDuplicates"
								checked={removeDuplicates}
								onCheckedChange={(checked) => {
									setRemoveDuplicates(checked === true);
								}}
								disabled={mergeMutation.isPending}
							/>
							<label
								htmlFor="removeDuplicates"
								className="cursor-pointer text-sm"
							>
								Remove duplicates (same name + same email)
							</label>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={handleMerge}
								disabled={
									selectedIds.size < 2 ||
									!mergedName.trim() ||
									mergeMutation.isPending
								}
								className="flex-1"
							>
								{mergeMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Merging...
									</>
								) : (
									"Merge"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/contacts" })}
								disabled={mergeMutation.isPending}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
