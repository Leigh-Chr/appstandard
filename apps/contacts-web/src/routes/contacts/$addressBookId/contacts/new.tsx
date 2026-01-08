import { indexContact } from "@appstandard/react-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import {
	type ContactFormData,
	ContactFormExtended,
} from "@/components/contact-form-extended";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/contacts/$addressBookId/contacts/new")({
	component: NewContactComponent,
	head: () => ({
		meta: [
			{ title: "New contact - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function NewContactComponent() {
	const { addressBookId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [_serverValidationErrors, setServerValidationErrors] = useState<
		Record<string, string[]> | undefined
	>();

	const { data: addressBook } = useQuery({
		...trpc.addressBook.getById.queryOptions({ id: addressBookId }),
	});

	const createMutation = useMutation(
		trpc.contact.create.mutationOptions({
			onSuccess: (contact) => {
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
				// Index contact for OS search
				void indexContact({
					id: contact.id,
					name: contact.formattedName,
				});
				toast.success("Contact created successfully");
				navigate({ to: `/contacts/${addressBookId}` });
			},
			onError: (error: unknown) => {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Error creating contact");
				}
			},
		}),
	);

	const handleSubmit = (data: ContactFormData) => {
		setServerValidationErrors(undefined);
		createMutation.mutate({
			addressBookId,
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

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-10">
				<Breadcrumb
					items={[
						{
							label: addressBook?.name || "Address Book",
							href: `/contacts/${addressBookId}`,
						},
						{ label: "New contact" },
					]}
				/>

				<ContactFormExtended
					mode="create"
					onSubmit={handleSubmit}
					onCancel={() => navigate({ to: `/contacts/${addressBookId}` })}
					isSubmitting={createMutation.isPending}
					addressBookId={addressBookId}
				/>
			</div>
		</div>
	);
}
