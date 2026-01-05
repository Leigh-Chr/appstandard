/**
 * Generic dialog to invite a member to a group by email
 * Used by Calendar, Contacts, and Tasks apps
 */

import { useForm } from "@tanstack/react-form";
import { Loader2, Mail } from "lucide-react";
import { useEffect } from "react";
import z from "zod";
import { Button } from "../button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../dialog";
import { FormMessage } from "../form-message";
import { Input } from "../input";
import { Label } from "../label";

const inviteSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export interface InviteGroupMemberDialogProps {
	/** Group ID */
	groupId: string;
	/** Whether the dialog is open */
	open: boolean;
	/** Callback when open state changes */
	onOpenChange: (open: boolean) => void;
	/** Whether an invite is pending */
	isInviting: boolean;
	/** Callback when invite is submitted */
	onInvite: (email: string) => void;
}

export function InviteGroupMemberDialog({
	groupId: _groupId,
	open,
	onOpenChange,
	isInviting,
	onInvite,
}: InviteGroupMemberDialogProps) {
	const form = useForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onSubmit: inviteSchema,
		},
		onSubmit: ({ value }) => {
			onInvite(value.email.trim());
		},
	});

	// Reset form when dialog closes
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			form.reset();
		}
		onOpenChange(newOpen);
	};

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite member</DialogTitle>
					<DialogDescription>
						Invite a user to join this group by email. They will receive an
						email with a link to accept the invitation.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="space-y-4 py-4">
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email address</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										placeholder="user@example.com"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isInviting}
										aria-describedby={
											field.state.meta.errors.length > 0
												? `${field.name}-error`
												: undefined
										}
										aria-invalid={
											field.state.meta.errors.length > 0 ? true : undefined
										}
									/>
									{field.state.meta.errors.map((error) => (
										<FormMessage
											key={error?.message}
											id={`${field.name}-error`}
										>
											{error?.message}
										</FormMessage>
									))}
								</div>
							)}
						</form.Field>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isInviting}
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button type="submit" disabled={isInviting || !canSubmit}>
									{isInviting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										<>
											<Mail className="mr-2 h-4 w-4" />
											Send invitation
										</>
									)}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
