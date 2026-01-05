/**
 * Dialog to invite a member to a group by email
 * Wrapper around shared InviteGroupMemberDialog component
 */

import { InviteGroupMemberDialog } from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface TaskInviteGroupMemberDialogProps {
	groupId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function TaskInviteGroupMemberDialog({
	groupId,
	open,
	onOpenChange,
}: TaskInviteGroupMemberDialogProps) {
	const queryClient = useQueryClient();

	const inviteMutation = useMutation(
		trpc.group.inviteMember.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.listMembers(groupId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.byId(groupId),
				});
				toast.success("Invitation sent");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error sending invitation");
			},
		}),
	);

	const handleInvite = (email: string) => {
		inviteMutation.mutate({
			groupId,
			userEmail: email,
		});
	};

	return (
		<InviteGroupMemberDialog
			groupId={groupId}
			open={open}
			onOpenChange={onOpenChange}
			isInviting={inviteMutation.isPending}
			onInvite={handleInvite}
		/>
	);
}

// Re-export for backwards compatibility
export { TaskInviteGroupMemberDialog as InviteGroupMemberDialog };
