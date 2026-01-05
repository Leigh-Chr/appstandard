import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FileDropZone } from "@/components/file-drop-zone";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/contacts/import")({
	component: ImportAddressBookComponent,
	head: () => ({
		meta: [
			{ title: "Import contacts - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Import an address book from a vCard file or URL. Compatible with Google Contacts, Apple Contacts, Outlook, and all standard vCard formats.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function ImportAddressBookComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// File import state
	const [fileContent, setFileContent] = useState<string | null>(null);
	const [addressBookName, setAddressBookName] = useState("");
	const [contactCount, setContactCount] = useState(0);

	// URL import state
	const [url, setUrl] = useState("");
	const [urlAddressBookName, setUrlAddressBookName] = useState("");

	const importMutation = useMutation({
		mutationFn: (data: { fileContent: string; name?: string }) =>
			trpcClient.addressBook.create
				.mutate({ name: data.name || "Imported Contacts" })
				.then(async (addressBook) => {
					const result = await trpcClient.import.importIntoAddressBook.mutate({
						addressBookId: addressBook.id,
						fileContent: data.fileContent,
						removeDuplicates: false,
					});
					return { addressBook, ...result };
				}),
		onSuccess: (data) => {
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.addressBook.list,
			});
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact.all });
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.dashboard.all,
			});
			toast.success(
				`Address book imported! ${data.importedContacts} contacts ready.`,
			);
			navigate({ to: `/contacts/${data.addressBook.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during import";
			toast.error(message);
		},
	});

	const importFromUrlMutation = useMutation({
		mutationFn: (data: { url: string; name?: string }) =>
			trpcClient.import.importFromUrl.mutate(data),
		onSuccess: (data) => {
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.addressBook.list,
			});
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact.all });
			void queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.dashboard.all,
			});
			toast.success(
				`Address book imported! ${data.importedContacts} contacts ready.`,
			);
			navigate({ to: `/contacts/${data.addressBook.id}` });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Error during import";
			toast.error(message);
		},
	});

	const handleFileSelect = (file: File) => {
		// Suggest name from file name
		const suggestedName = file.name
			.replace(/\.(vcf|vcard)$/i, "")
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
		if (!addressBookName) {
			setAddressBookName(suggestedName);
		}
	};

	const handlePreviewParsed = (contacts: Array<{ name: string }>) => {
		setContactCount(contacts.length);
	};

	const handleImport = async () => {
		if (!fileContent) {
			toast.error("Please select a file");
			return;
		}

		importMutation.mutate({
			fileContent,
			name: addressBookName || undefined,
		});
	};

	const handleImportFromUrl = () => {
		if (!url.trim()) {
			toast.error("Please enter a URL");
			return;
		}

		importFromUrlMutation.mutate({
			url: url.trim(),
			name: urlAddressBookName || undefined,
		});
	};

	const isPending = importMutation.isPending || importFromUrlMutation.isPending;

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="transition-all duration-200 hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Import an address book
						</CardTitle>
						<CardDescription>
							Import contacts from a file or URL. Works with Google Contacts,
							Apple Contacts, Outlook, and all vCard formats.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="file" className="w-full">
							<TabsList className="mb-6 grid w-full grid-cols-2">
								<TabsTrigger value="file" disabled={isPending}>
									<Upload className="mr-2 h-4 w-4" />
									From a file
								</TabsTrigger>
								<TabsTrigger value="url" disabled={isPending}>
									<Globe className="mr-2 h-4 w-4" />
									From a URL
								</TabsTrigger>
							</TabsList>

							{/* File import tab */}
							<TabsContent value="file" className="space-y-6">
								<FileDropZone
									onFileSelect={handleFileSelect}
									onFileContent={setFileContent}
									onPreviewParsed={handlePreviewParsed}
									disabled={isPending}
								/>

								{fileContent && (
									<div className="space-y-2">
										<Label htmlFor="name">Address book name</Label>
										<Input
											id="name"
											value={addressBookName}
											onChange={(e) => setAddressBookName(e.target.value)}
											placeholder="My imported contacts"
											disabled={isPending}
										/>
										<p className="text-muted-foreground text-xs">
											Leave empty to use the file name
										</p>
									</div>
								)}

								<div className="flex gap-2">
									<Button
										onClick={handleImport}
										disabled={!fileContent || isPending}
										className="interactive-glow flex-1"
									>
										{importMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Importing...
											</>
										) : (
											<>
												Import
												{contactCount > 0 && ` (${contactCount} contacts)`}
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={() => navigate({ to: "/contacts" })}
										disabled={isPending}
									>
										Cancel
									</Button>
								</div>
							</TabsContent>

							{/* URL import tab */}
							<TabsContent value="url" className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="url">Address book URL</Label>
									<Input
										id="url"
										type="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										placeholder="https://example.com/contacts.vcf"
										disabled={isPending}
									/>
									<p className="text-muted-foreground text-xs">
										Paste the public URL of your address book (vCard format)
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="url-name">Address book name (optional)</Label>
									<Input
										id="url-name"
										value={urlAddressBookName}
										onChange={(e) => setUrlAddressBookName(e.target.value)}
										placeholder="My contacts"
										disabled={isPending}
									/>
								</div>

								{/* Help text */}
								<div className="rounded-lg bg-muted/50 p-4 text-sm">
									<p className="mb-2 font-medium">
										Where to find your contacts URL?
									</p>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
										<li>
											<strong>Google Contacts</strong>: Export → vCard format
										</li>
										<li>
											<strong>Apple iCloud</strong>: Contacts → Export vCard
										</li>
										<li>
											<strong>CardDAV servers</strong>: Use the CardDAV URL
										</li>
									</ul>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={handleImportFromUrl}
										disabled={!url.trim() || isPending}
										className="flex-1"
									>
										{importFromUrlMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Importing...
											</>
										) : (
											<>
												<Globe className="mr-2 h-4 w-4" />
												Import from URL
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={() => navigate({ to: "/contacts" })}
										disabled={isPending}
									>
										Cancel
									</Button>
								</div>

								<p className="text-center text-muted-foreground text-xs">
									You will be able to refresh this address book from the URL
									later
								</p>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
