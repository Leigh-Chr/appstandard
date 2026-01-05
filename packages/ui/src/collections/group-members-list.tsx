/**
 * Generic Group Members List component
 * Displays members with roles and actions (remove, leave)
 * Used by Calendar, Contacts, and Tasks apps
 */

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Loader2, LogOut, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
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
import { Button } from "../button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../card";
import { Skeleton } from "../skeleton";

export interface GroupMember {
	id: string;
	userId: string;
	role: "OWNER" | "MEMBER";
	invitedBy: string;
	invitedAt: string | Date;
	acceptedAt: string | Date | null;
	user: {
		id: string;
		email: string;
		name: string | null;
	} | null;
	inviter: {
		id: string;
		name: string | null;
		email: string;
	} | null;
}

interface MemberCardProps {
	member: GroupMember;
	currentUserId?: string | undefined;
	isOwner: boolean;
	onRemove: (member: GroupMember) => void;
	onLeave: () => void;
	isRemoving: boolean;
	isLeaving: boolean;
}

function MemberCard({
	member,
	currentUserId,
	isOwner,
	onRemove,
	onLeave,
	isRemoving,
	isLeaving,
}: MemberCardProps) {
	const isCurrentUser = member.userId === currentUserId;
	const isPending =
		member.acceptedAt === null ||
		member.acceptedAt === undefined ||
		(member.acceptedAt instanceof Date &&
			Number.isNaN(member.acceptedAt.getTime()));
	const canRemove = isOwner && !isCurrentUser && member.role !== "OWNER";
	const canLeave = !isOwner && isCurrentUser && member.role === "MEMBER";

	return (
		<div className="flex items-center justify-between rounded-lg border p-3">
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<span className="font-medium">
						{member.user?.name || member.user?.email || "Unknown"}
					</span>
					<Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
						{member.role}
					</Badge>
					{isPending ? (
						<Badge variant="outline" className="gap-1">
							<UserX className="h-3 w-3" />
							Pending
						</Badge>
					) : (
						<Badge variant="outline" className="gap-1">
							<UserCheck className="h-3 w-3" />
							Accepted
						</Badge>
					)}
				</div>
				<div className="mt-1 text-muted-foreground text-xs">
					{member.user?.email}
				</div>
				{member.inviter && (
					<div className="mt-1 text-muted-foreground text-xs">
						Invited by {member.inviter.name || member.inviter.email} on{" "}
						{format(
							member.invitedAt instanceof Date
								? member.invitedAt
								: new Date(member.invitedAt),
							"MMM d, yyyy",
							{ locale: enUS },
						)}
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				{canRemove && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRemove(member)}
						disabled={isRemoving}
					>
						{isRemoving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
					</Button>
				)}
				{canLeave && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onLeave}
						disabled={isLeaving}
					>
						{isLeaving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<LogOut className="mr-2 h-4 w-4" />
								Leave
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}

export interface GroupMembersListLabels {
	/** Entity name in plural form (e.g., "calendars", "address books", "task lists") */
	entityPlural: string;
}

export interface GroupMembersListProps {
	/** Labels for the entity being managed */
	labels: GroupMembersListLabels;
	/** Group ID */
	groupId: string;
	/** Whether the current user is the group owner */
	isOwner: boolean;
	/** Current user ID */
	currentUserId?: string | undefined;
	/** Members list (undefined while loading) */
	members: GroupMember[] | undefined;
	/** Whether members are loading */
	isLoading: boolean;
	/** Whether a remove operation is pending */
	isRemoving: boolean;
	/** Whether a leave operation is pending */
	isLeaving: boolean;
	/** Callback when remove is confirmed */
	onRemoveMember: (userId: string) => void;
	/** Callback when leave is confirmed */
	onLeaveGroup: () => void;
}

export function GroupMembersList({
	labels,
	groupId: _groupId,
	isOwner,
	currentUserId,
	members,
	isLoading,
	isRemoving,
	isLeaving,
	onRemoveMember,
	onLeaveGroup,
}: GroupMembersListProps) {
	const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
		null,
	);

	const handleRemoveClick = (member: GroupMember) => {
		setMemberToRemove(member);
		setRemoveDialogOpen(true);
	};

	const handleLeaveClick = () => {
		setLeaveDialogOpen(true);
	};

	const handleRemoveConfirm = () => {
		if (memberToRemove) {
			onRemoveMember(memberToRemove.userId);
			setRemoveDialogOpen(false);
			setMemberToRemove(null);
		}
	};

	const handleLeaveConfirm = () => {
		onLeaveGroup();
		setLeaveDialogOpen(false);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Members</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	const membersArray: GroupMember[] = members || [];

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Members</CardTitle>
					<CardDescription>
						{membersArray.length} member{membersArray.length !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{membersArray.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No members in this group
						</p>
					) : (
						<div className="space-y-3">
							{membersArray.map((member) => (
								<MemberCard
									key={member.id}
									member={member}
									currentUserId={currentUserId}
									isOwner={isOwner}
									onRemove={handleRemoveClick}
									onLeave={handleLeaveClick}
									isRemoving={isRemoving}
									isLeaving={isLeaving}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Remove member confirmation */}
			<AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove member?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove{" "}
							<strong>
								{memberToRemove?.user?.name || memberToRemove?.user?.email}
							</strong>{" "}
							from this group? They will lose access to all{" "}
							{labels.entityPlural} in this group.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveConfirm}
							disabled={isRemoving}
						>
							{isRemoving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Removing...
								</>
							) : (
								"Remove"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Leave group confirmation */}
			<AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave group?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to leave this group? You will lose access to
							all {labels.entityPlural} in this group.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleLeaveConfirm}
							disabled={isLeaving}
						>
							{isLeaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Leaving...
								</>
							) : (
								"Leave"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
