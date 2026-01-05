/**
 * QuickActions - Dashboard quick action buttons
 * Reusable quick action component for dashboard
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button";

export interface QuickAction {
	id: string;
	label: string;
	icon: LucideIcon;
	href: string;
	variant?: "default" | "outline" | "secondary" | undefined;
}

export interface QuickActionsProps {
	actions: QuickAction[];
	renderLink: (props: {
		href: string;
		children: ReactNode;
		className?: string;
	}) => ReactNode;
}

export function QuickActions({ actions, renderLink }: QuickActionsProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{actions.map((action) => (
				<Button
					key={action.id}
					size="sm"
					variant={action.variant || "default"}
					asChild
				>
					{renderLink({
						href: action.href,
						children: (
							<>
								<action.icon className="mr-1.5 h-4 w-4" />
								{action.label}
							</>
						),
					})}
				</Button>
			))}
		</div>
	);
}
