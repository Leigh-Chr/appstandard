/**
 * IM Handles section for contact form
 * Supports multiple instant messaging handles with service selection
 * Based on RFC 6350 IMPP property (Section 6.4.3)
 */

import {
	Button,
	Card,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import type { ContactIMData } from "@appstandard-contacts/core";
import { IM_SERVICE_VALUES } from "@appstandard-contacts/core";
import { MessageCircle, Plus, X } from "lucide-react";

interface ImHandlesSectionProps {
	imHandles: ContactIMData[];
	onChange: (handles: ContactIMData[]) => void;
	isSubmitting: boolean;
}

const IM_SERVICE_LABELS: Record<string, string> = {
	telegram: "Telegram",
	whatsapp: "WhatsApp",
	signal: "Signal",
	discord: "Discord",
	slack: "Slack",
	teams: "Microsoft Teams",
	matrix: "Matrix",
	skype: "Skype",
	xmpp: "XMPP/Jabber",
	sip: "SIP",
	aim: "AIM",
	icq: "ICQ",
	irc: "IRC",
	msn: "MSN",
	yahoo: "Yahoo",
};

const IM_SERVICE_PLACEHOLDERS: Record<string, string> = {
	telegram: "@username or +123456789",
	whatsapp: "+123456789",
	signal: "+123456789",
	discord: "username#1234 or username",
	slack: "@username or email",
	teams: "email@domain.com",
	matrix: "@user:matrix.org",
	skype: "username or live:username",
	xmpp: "user@jabber.org",
	sip: "sip:user@domain.com",
	aim: "screenname",
	icq: "123456789",
	irc: "nickname",
	msn: "email@hotmail.com",
	yahoo: "yahoo_id",
};

export function ImHandlesSection({
	imHandles,
	onChange,
	isSubmitting,
}: ImHandlesSectionProps) {
	const handleAddHandle = () => {
		onChange([...imHandles, { handle: "", service: "telegram" }]);
	};

	const handleRemoveHandle = (index: number) => {
		onChange(imHandles.filter((_, i) => i !== index));
	};

	const handleHandleChange = (index: number, value: string) => {
		const newHandles = [...imHandles];
		const current = newHandles[index];
		if (current) {
			newHandles[index] = { ...current, handle: value };
			onChange(newHandles);
		}
	};

	const handleServiceChange = (index: number, service: string) => {
		const newHandles = [...imHandles];
		const current = newHandles[index];
		if (current) {
			newHandles[index] = { ...current, service };
			onChange(newHandles);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="flex items-center gap-2 font-medium text-sm">
					<MessageCircle className="h-4 w-4 text-muted-foreground" />
					Instant Messaging ({imHandles.length})
				</h4>
			</div>

			{imHandles.length === 0 && (
				<div className="flex items-start gap-3 rounded-md border border-muted bg-muted/50 p-4">
					<MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No IM handles yet. Click "Add IM handle" below to add one.
					</p>
				</div>
			)}

			{imHandles.map((im, index) => (
				<Card key={`im-${index}`} className="border-muted p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<MessageCircle className="h-4 w-4 text-muted-foreground" />
								IM Handle {index + 1}
							</h4>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleRemoveHandle(index)}
								disabled={isSubmitting}
								aria-label={`Remove IM handle ${index + 1}`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`im-service-${index}`}>Service</Label>
								<Select
									value={im.service || "telegram"}
									onValueChange={(value) => handleServiceChange(index, value)}
									disabled={isSubmitting}
								>
									<SelectTrigger id={`im-service-${index}`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{IM_SERVICE_VALUES.map((service) => (
											<SelectItem key={service} value={service}>
												{IM_SERVICE_LABELS[service] || service}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`im-handle-${index}`}>Handle</Label>
								<Input
									id={`im-handle-${index}`}
									type="text"
									value={im.handle}
									onChange={(e) => handleHandleChange(index, e.target.value)}
									disabled={isSubmitting}
									placeholder={
										IM_SERVICE_PLACEHOLDERS[im.service] || "Username or ID"
									}
								/>
							</div>
						</div>
					</div>
				</Card>
			))}

			<Button
				type="button"
				variant="outline"
				onClick={handleAddHandle}
				disabled={isSubmitting}
			>
				<Plus className="h-4 w-4" />
				Add IM handle
			</Button>
		</div>
	);
}
