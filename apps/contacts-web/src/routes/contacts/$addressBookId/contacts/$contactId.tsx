import { indexContact } from "@appstandard/react-utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Loader,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import {
	type ContactFormData,
	ContactFormExtended,
} from "@/components/contact-form-extended";
import { QRCodeContactButton } from "@/components/qr-code-contact-button";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Transform contact data from API to form data
 */
function transformContactToFormData(
	contact: NonNullable<ReturnType<typeof useContact>["contact"]>,
): Partial<ContactFormData> {
	return {
		formattedName: contact.formattedName,
		givenName: contact.givenName || undefined,
		familyName: contact.familyName || undefined,
		additionalName: contact.additionalName || undefined,
		namePrefix: contact.namePrefix || undefined,
		nameSuffix: contact.nameSuffix || undefined,
		nickname: contact.nickname || undefined,
		organization: contact.organization || undefined,
		title: contact.title || undefined,
		role: contact.role || undefined,
		birthday: contact.birthday ? new Date(contact.birthday) : undefined,
		anniversary: contact.anniversary
			? new Date(contact.anniversary)
			: undefined,
		gender: contact.gender as ContactFormData["gender"],
		kind: contact.kind as ContactFormData["kind"],
		photoUrl: contact.photoUrl || undefined,
		url: contact.url || undefined,
		note: contact.note || undefined,
		categories:
			contact.categories?.map((c) => c.category).join(", ") || undefined,
	};
}

function useContact(contactId: string) {
	const { data: contact, isLoading } = useQuery({
		...trpc.contact.getById.queryOptions({ id: contactId }),
		enabled: !!contactId,
	});
	return { contact, isLoading };
}

/**
 * Loading state component
 */
function LoadingState() {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
			<div className="flex items-center justify-center py-12">
				<Loader size="lg" />
			</div>
		</div>
	);
}

/**
 * Not found state component
 */
function NotFoundState() {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
			<div className="text-center text-muted-foreground">Contact not found</div>
		</div>
	);
}

/**
 * Duplicate Dialog Component
 */
function DuplicateDialog({
	open,
	onOpenChange,
	onDuplicate,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDuplicate: () => void;
	isPending: boolean;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Duplicate contact</AlertDialogTitle>
					<AlertDialogDescription>
						Create a copy of this contact.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDuplicate} disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Duplicating...
							</>
						) : (
							"Duplicate"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export const Route = createFileRoute(
	"/contacts/$addressBookId/contacts/$contactId",
)({
	component: EditContactComponent,
	head: () => ({
		meta: [
			{ title: "Edit contact - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function EditContactComponent() {
	const { addressBookId, contactId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

	const { contact, isLoading } = useContact(contactId);

	const { data: addressBook } = useQuery({
		...trpc.addressBook.getById.queryOptions({ id: addressBookId }),
	});

	const duplicateMutation = useMutation(
		trpc.contact.duplicate.mutationOptions({
			onSuccess: (duplicatedContact) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(addressBookId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Contact duplicated successfully");
				setDuplicateDialogOpen(false);
				// Navigate to the new contact
				navigate({
					to: `/contacts/${addressBookId}/contacts/${duplicatedContact.id}`,
				});
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during duplication";
				toast.error(message);
			},
		}),
	);

	const handleDuplicate = () => {
		duplicateMutation.mutate({ id: contactId });
	};

	const updateMutation = useMutation(
		trpc.contact.update.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(addressBookId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				// Update OS content index
				if (variables.formattedName) {
					void indexContact({
						id: variables.id,
						name: variables.formattedName,
					});
				}
				toast.success("Contact updated successfully");
				navigate({ to: `/contacts/${addressBookId}` });
			},
			onError: (error: unknown) => {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Error updating contact");
				}
			},
		}),
	);

	const handleSubmit = (data: ContactFormData) => {
		updateMutation.mutate({
			id: contactId,
			formattedName: data.formattedName,
			givenName: data.givenName,
			familyName: data.familyName,
			additionalName: data.additionalName,
			namePrefix: data.namePrefix,
			nameSuffix: data.nameSuffix,
			nickname: data.nickname,
			organization: data.organization,
			title: data.title,
			role: data.role,
			birthday: data.birthday,
			anniversary: data.anniversary,
			gender: data.gender,
			kind: data.kind,
			photoUrl: data.photoUrl,
			url: data.url,
			note: data.note,
			categories: data.categories,
		});
	};

	if (isLoading) {
		return <LoadingState />;
	}

	if (!contact) {
		return <NotFoundState />;
	}

	const initialData = transformContactToFormData(contact);

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-4xl space-y-4 px-4 py-6 sm:py-10">
				<div className="flex items-center justify-between">
					<Breadcrumb
						items={[
							{
								label: addressBook?.name || "Address Book",
								href: `/contacts/${addressBookId}`,
							},
							{ label: contact?.formattedName || "Contact" },
						]}
					/>
					<div className="flex items-center gap-2">
						<QRCodeContactButton contact={contact} />
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDuplicateDialogOpen(true)}
						>
							<Copy className="mr-2 h-4 w-4" />
							Duplicate
						</Button>
					</div>
				</div>

				<ContactFormExtended
					mode="edit"
					initialData={initialData}
					onSubmit={handleSubmit}
					onCancel={() => navigate({ to: `/contacts/${addressBookId}` })}
					isSubmitting={updateMutation.isPending}
					addressBookId={addressBookId}
				/>

				<DuplicateDialog
					open={duplicateDialogOpen}
					onOpenChange={setDuplicateDialogOpen}
					onDuplicate={handleDuplicate}
					isPending={duplicateMutation.isPending}
				/>
			</div>
		</div>
	);
}
