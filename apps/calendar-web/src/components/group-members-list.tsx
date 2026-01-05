/**
 * Group members list component
 * Wrapper around shared GroupMembersList component
 */

import { type GroupMember, GroupMembersList } from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface CalendarGroupMembersListProps {
	groupId: string;
	isOwner: boolean;
	currentUserId?: string | undefined;
}

function CalendarGroupMembersList({
	groupId,
	isOwner,
	currentUserId,
}: CalendarGroupMembersListProps) {
	const queryClient = useQueryClient();

	// Fetch members
	const { data: members, isLoading } = useQuery({
		...trpc.calendar.group.listMembers.queryOptions({ groupId }),
	});

	// Remove member mutation
	const removeMemberMutation = useMutation(
		trpc.calendar.group.removeMember.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.listMembers(groupId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.byId(groupId),
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
		trpc.calendar.group.leaveGroup.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.calendarGroup.all,
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
			labels={{ entityPlural: "calendars" }}
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
export { CalendarGroupMembersList as GroupMembersList };
