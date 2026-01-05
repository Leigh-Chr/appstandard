/**
 * Group members list component
 * Wrapper around shared GroupMembersList component
 */

import { type GroupMember, GroupMembersList } from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface ContactGroupMembersListProps {
	groupId: string;
	isOwner: boolean;
	currentUserId?: string | undefined;
}

function ContactGroupMembersList({
	groupId,
	isOwner,
	currentUserId,
}: ContactGroupMembersListProps) {
	const queryClient = useQueryClient();

	// Fetch members
	const { data: members, isLoading } = useQuery({
		...trpc.group.listMembers.queryOptions({ groupId }),
	});

	// Remove member mutation
	const removeMemberMutation = useMutation(
		trpc.group.removeMember.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.listMembers(groupId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.byId(groupId),
				});
				toast.success("Member removed");
			},
			onError: (error) => {
				toast.error(error.message || "Error removing member");
			},
		}),
	);

	// Leave group mutation
	const leaveGroupMutation = useMutation(
		trpc.group.leaveGroup.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.all,
				});
				toast.success("You left the group");
			},
			onError: (error) => {
				toast.error(error.message || "Error leaving group");
			},
		}),
	);

	const handleRemoveMember = (userId: string) => {
		removeMemberMutation.mutate({ groupId, userId });
	};

	const handleLeaveGroup = () => {
		leaveGroupMutation.mutate({ groupId });
	};

	return (
		<GroupMembersList
			labels={{ entityPlural: "address books" }}
			groupId={groupId}
			isOwner={isOwner}
			currentUserId={currentUserId}
			members={members as GroupMember[] | undefined}
			isLoading={isLoading}
			isRemoving={removeMemberMutation.isPending}
			isLeaving={leaveGroupMutation.isPending}
			onRemoveMember={handleRemoveMember}
			onLeaveGroup={handleLeaveGroup}
		/>
	);
}

// Re-export for backwards compatibility
export { ContactGroupMembersList as GroupMembersList };
