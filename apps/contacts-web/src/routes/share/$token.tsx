import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BookUser,
	Building2,
	CheckCircle2,
	Download,
	ExternalLink,
	Layers,
	Loader2,
	Mail,
	Phone,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

const BASE_URL = "https://contacts.appstandard.app";

export const Route = createFileRoute("/share/$token")({
	component: SharePage,
	loader: async ({ params }) => {
		const { token } = params;
		if (!token) return null;

		try {
			const typeDetection = await trpcClient.share.detectType.query({ token });

			if (!typeDetection?.type) return null;

			if (typeDetection.type === "single") {
				const info = await trpcClient.share.getInfoByToken.query({ token });
				return {
					type: "single" as const,
					addressBookName: info.addressBookName,
					contactCount: info.contactCount,
					shareName: info.shareName,
				};
			}

			if (typeDetection.type === "bundle") {
				const bundleInfo = await trpcClient.share.bundle.getInfoByToken.query({
					token,
				});
				return {
					type: "bundle" as const,
					bundleName: bundleInfo.bundleName,
					addressBookCount: bundleInfo.addressBookCount,
					totalContacts: bundleInfo.totalContacts,
				};
			}
		} catch {
			return null;
		}

		return null;
	},
	head: ({ loaderData, params }) => {
		const shareUrl = `${BASE_URL}/share/${params.token}`;

		let title = "Shared Address Book - AppStandard Contacts";
		let description =
			"View this shared address book. Export contacts as vCard.";

		if (loaderData) {
			if (loaderData.type === "single") {
				title = `${loaderData.addressBookName} - Shared Address Book - AppStandard Contacts`;
				description = `Address book "${loaderData.addressBookName}" with ${loaderData.contactCount} contact${loaderData.contactCount !== 1 ? "s" : ""}. Ready to view and export as vCard.`;
			} else if (loaderData.type === "bundle") {
				title = `${loaderData.bundleName || "Address Books Bundle"} - AppStandard Contacts`;
				description = `Bundle "${loaderData.bundleName || "Contacts"}" with ${loaderData.addressBookCount} address book${loaderData.addressBookCount !== 1 ? "s" : ""} and ${loaderData.totalContacts} total contacts.`;
			}
		}

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: shareUrl },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: shareUrl }],
		};
	},
});

function getErrorMessageForReason(reason: string): string {
	switch (reason) {
		case "not_found":
			return "This link is no longer available. It may have expired or been removed.";
		case "disabled":
			return "This link is no longer available. It may have been disabled.";
		case "expired":
			return "This link is no longer available. It may have expired.";
		default:
			return "This link is no longer available.";
	}
}

async function downloadShareAsVCard(
	token: string,
	shareType: "single" | "bundle" | null,
): Promise<{ filename: string }> {
	let filename: string;

	if (shareType === "bundle") {
		const bundleData = await trpcClient.share.bundle.getByToken.query({
			token,
		});
		const blob = new Blob([bundleData.vcardContent], { type: "text/vcard" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		filename = `${bundleData.bundleName || "contacts"}.vcf`;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		return { filename };
	}

	const data = await trpcClient.share.getByToken.query({ token });
	filename = `${data.addressBookName}.vcf`;

	const blob = new Blob([data.vcardContent], { type: "text/vcard" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	return { filename };
}

function ShareErrorView({ errorMessage }: { errorMessage: string }) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-6 sm:py-10">
				<Card className="w-full">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
							<XCircle className="h-8 w-8 text-destructive" />
						</div>
						<CardTitle>Invalid link</CardTitle>
						<CardDescription>{errorMessage}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild variant="outline">
							<Link to="/">Back to home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function ShareLoadingView() {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-6 sm:py-10">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<p className="mt-4 text-muted-foreground">Loading...</p>
			</div>
		</div>
	);
}

interface Contact {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	organization: string | null;
	categories: string[];
}

function ContactCard({ contact }: { contact: Contact }) {
	return (
		<Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
			<div className="absolute inset-y-0 left-0 w-1 bg-primary transition-all duration-200 group-hover:w-1.5" />
			<CardContent className="py-4 pr-4 pl-5">
				<div className="flex items-start gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<User className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="font-medium">{contact.name}</h3>
						{contact.organization && (
							<div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
								<Building2 className="h-3 w-3" />
								{contact.organization}
							</div>
						)}
						<div className="mt-2 flex flex-wrap gap-2">
							{contact.email && (
								<Badge variant="outline" className="gap-1">
									<Mail className="h-3 w-3" />
									{contact.email}
								</Badge>
							)}
							{contact.phone && (
								<Badge variant="outline" className="gap-1">
									<Phone className="h-3 w-3" />
									{contact.phone}
								</Badge>
							)}
						</div>
						{contact.categories.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1">
								{contact.categories.map((cat) => (
									<Badge key={cat} variant="secondary" className="text-xs">
										{cat}
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function useShareData(token: string | undefined) {
	const { data: typeDetection, isLoading: isDetectingType } = useQuery({
		queryKey: ["share", "detectType", token],
		queryFn: () => trpcClient.share.detectType.query({ token: token || "" }),
		enabled: !!token && token.length > 0,
		retry: false,
	});

	const shareType = typeDetection?.type ?? null;
	const detectionError =
		typeDetection && "reason" in typeDetection
			? (typeDetection.reason as string | undefined)
			: undefined;

	const {
		data: singleInfo,
		isLoading: isLoadingSingle,
		error: singleError,
	} = useQuery({
		queryKey: ["share", "info", token],
		queryFn: () =>
			trpcClient.share.getInfoByToken.query({ token: token || "" }),
		enabled: !!token && token.length > 0 && shareType === "single",
		retry: false,
	});

	const {
		data: bundleInfo,
		isLoading: isLoadingBundle,
		error: bundleError,
	} = useQuery({
		queryKey: ["share", "bundleInfo", token],
		queryFn: () =>
			trpcClient.share.bundle.getInfoByToken.query({ token: token || "" }),
		enabled: !!token && token.length > 0 && shareType === "bundle",
		retry: false,
	});

	const isLoading = isDetectingType || isLoadingSingle || isLoadingBundle;

	let error: { message: string } | null = null;
	if (shareType === "single" && singleError) {
		error = singleError as { message: string };
	} else if (shareType === "bundle" && bundleError) {
		error = bundleError as { message: string };
	} else if (detectionError) {
		error = { message: getErrorMessageForReason(detectionError) };
	}

	return {
		shareType,
		isLoading,
		error,
		singleInfo,
		bundleInfo,
	};
}

function SingleShareView({
	info,
	contactsData,
	downloadState,
	onDownload,
}: {
	info: {
		addressBookName: string;
		shareName?: string | null;
		contactCount: number;
	};
	contactsData: { contacts: Contact[]; addressBookColor: string | null } | null;
	downloadState: "idle" | "loading" | "success" | "error";
	onDownload: () => void;
}) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
				<Card className="mb-6">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<BookUser className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-2xl">{info.addressBookName}</CardTitle>
						<CardDescription>
							{info.shareName && (
								<span className="mb-1 block text-sm">{info.shareName}</span>
							)}
							{info.contactCount} contact{info.contactCount !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							This address book has been shared with you. Download it as a vCard
							file to import into your contacts app.
						</p>

						<Button
							onClick={onDownload}
							className="w-full"
							size="lg"
							disabled={downloadState === "loading"}
						>
							{downloadState === "loading" ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Downloading...
								</>
							) : downloadState === "success" ? (
								<>
									<CheckCircle2 className="mr-2 h-5 w-5" />
									Downloaded!
								</>
							) : (
								<>
									<Download className="mr-2 h-5 w-5" />
									Download contacts
								</>
							)}
						</Button>

						{downloadState === "success" && (
							<p className="text-center text-muted-foreground text-sm">
								The file has been downloaded. Open it with your contacts app to
								import the contacts.
							</p>
						)}

						<div className="border-t pt-4">
							<p className="mb-3 text-center text-muted-foreground text-xs">
								Compatible with:
							</p>
							<div className="flex flex-wrap justify-center gap-2 text-muted-foreground text-xs">
								<span className="rounded-full bg-muted px-3 py-1">
									Apple Contacts
								</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Google Contacts
								</span>
								<span className="rounded-full bg-muted px-3 py-1">Outlook</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Thunderbird
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{contactsData && contactsData.contacts.length > 0 && (
					<div className="space-y-4">
						<h2 className="font-semibold text-xl">Contacts</h2>
						<div className="space-y-3">
							{contactsData.contacts.map((contact) => (
								<ContactCard key={contact.id} contact={contact} />
							))}
						</div>
					</div>
				)}

				{contactsData && contactsData.contacts.length === 0 && (
					<Card>
						<CardContent className="py-10 text-center">
							<p className="text-muted-foreground">
								No contacts in this address book
							</p>
						</CardContent>
					</Card>
				)}

				<div className="mt-8 text-center">
					<p className="text-muted-foreground text-sm">
						Need to manage your own contacts?
					</p>
					<Button asChild variant="link" className="text-primary">
						<Link to="/">
							Discover AppStandard Contacts
							<ExternalLink className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function BundleShareView({
	bundleInfo,
	downloadState,
	onDownload,
}: {
	bundleInfo: {
		bundleName: string;
		addressBookCount: number;
		totalContacts: number;
		addressBooks: Array<{
			id: string;
			name: string;
			color?: string | null;
			contactCount: number;
		}>;
	};
	downloadState: "idle" | "loading" | "success" | "error";
	onDownload: () => void;
}) {
	return (
		<div className="relative min-h-screen">
			<div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
				<Card className="mb-6">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Layers className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-2xl">{bundleInfo.bundleName}</CardTitle>
						<CardDescription>
							{bundleInfo.addressBookCount} address book
							{bundleInfo.addressBookCount !== 1 ? "s" : ""} •{" "}
							{bundleInfo.totalContacts} contact
							{bundleInfo.totalContacts !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							This bundle contains multiple address books. Download them all
							together in a single vCard file.
						</p>

						<Button
							onClick={onDownload}
							className="w-full"
							size="lg"
							disabled={downloadState === "loading"}
						>
							{downloadState === "loading" ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Downloading...
								</>
							) : downloadState === "success" ? (
								<>
									<CheckCircle2 className="mr-2 h-5 w-5" />
									Downloaded!
								</>
							) : (
								<>
									<Download className="mr-2 h-5 w-5" />
									Download all contacts
								</>
							)}
						</Button>

						{downloadState === "success" && (
							<p className="text-center text-muted-foreground text-sm">
								The file has been downloaded. Open it with your contacts app to
								import the contacts.
							</p>
						)}

						{bundleInfo.addressBooks.length > 0 && (
							<div className="border-t pt-4">
								<p className="mb-3 text-center font-medium text-sm">
									Address books in this bundle:
								</p>
								<div className="space-y-2">
									{bundleInfo.addressBooks.map((ab) => (
										<div
											key={ab.id}
											className="flex items-center justify-between rounded-lg border bg-card p-3"
										>
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: ab.color || "#D4A017" }}
												/>
												<span className="font-medium text-sm">{ab.name}</span>
												<span className="text-muted-foreground text-xs">
													({ab.contactCount} contacts)
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="border-t pt-4">
							<p className="mb-3 text-center text-muted-foreground text-xs">
								Compatible with:
							</p>
							<div className="flex flex-wrap justify-center gap-2 text-muted-foreground text-xs">
								<span className="rounded-full bg-muted px-3 py-1">
									Apple Contacts
								</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Google Contacts
								</span>
								<span className="rounded-full bg-muted px-3 py-1">Outlook</span>
								<span className="rounded-full bg-muted px-3 py-1">
									Thunderbird
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="mt-8 text-center">
					<p className="text-muted-foreground text-sm">
						Need to manage your own contacts?
					</p>
					<Button asChild variant="link" className="text-primary">
						<Link to="/">
							Discover AppStandard Contacts
							<ExternalLink className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function SharePage() {
	const { token } = Route.useParams();
	const [downloadState, setDownloadState] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	const { shareType, isLoading, error, singleInfo, bundleInfo } =
		useShareData(token);

	const handleDownload = async () => {
		setDownloadState("loading");
		try {
			await downloadShareAsVCard(token, shareType);
			setDownloadState("success");
			toast.success(
				shareType === "bundle"
					? "Address books bundle downloaded!"
					: "Address book downloaded!",
			);
		} catch {
			setDownloadState("error");
			toast.error("Error during download");
		}
	};

	if (error && !isLoading) {
		return <ShareErrorView errorMessage={error.message} />;
	}

	if (isLoading) {
		return <ShareLoadingView />;
	}

	if (shareType === "bundle" && bundleInfo) {
		return (
			<BundleShareView
				bundleInfo={{
					bundleName: bundleInfo.bundleName ?? "",
					addressBookCount: bundleInfo.addressBookCount,
					totalContacts: bundleInfo.totalContacts,
					addressBooks: bundleInfo.addressBooks.map(
						(ab: {
							id: string;
							name: string;
							color: string | null;
							contactCount: number;
						}) => ({
							id: ab.id,
							name: ab.name,
							color: ab.color ?? null,
							contactCount: ab.contactCount,
						}),
					),
				}}
				downloadState={downloadState}
				onDownload={handleDownload}
			/>
		);
	}

	if (shareType === "single" && singleInfo) {
		return (
			<SingleShareView
				info={{
					addressBookName: singleInfo.addressBookName,
					shareName: singleInfo.shareName,
					contactCount: singleInfo.contactCount,
				}}
				contactsData={null}
				downloadState={downloadState}
				onDownload={handleDownload}
			/>
		);
	}

	return null;
}
