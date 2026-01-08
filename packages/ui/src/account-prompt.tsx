/**
 * Generic account prompt component for anonymous users
 * Configurable for different app contexts (calendar, contacts, tasks)
 */

import { cn } from "@appstandard/react-utils";
import { Cloud, Smartphone, X } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { Button } from "./button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./card";

/**
 * Normalized usage data structure
 * Apps should transform their specific usage data to this format
 */
export interface AccountPromptUsage {
	/** Current count of collections (calendars, address books, task lists) */
	collectionCount: number;
	/** Maximum allowed collections */
	maxCollections: number;
	/** Map of collection IDs to item counts */
	itemCounts: Record<string, number>;
	/** Maximum items per collection */
	maxItemsPerCollection: number;
}

/**
 * Configuration for the account prompt
 */
export interface AccountPromptConfig {
	/** Entity name plural (e.g., "calendars", "address books", "task lists") */
	entityNamePlural: string;
	/** Icon component for the benefit section */
	entityIcon: ComponentType<{ className?: string }>;
	/** Maximum limit label (e.g., "100 calendars") */
	maxLimitLabel: string;
	/** Sync message (e.g., "Sync your calendars across all your devices") */
	syncMessage: string;
	/** Keep safe title (e.g., "Keep your calendars safe") */
	keepSafeTitle: string;
	/** Backup description (e.g., "Back up your calendars in the cloud") */
	backupDescription: string;
}

export interface AccountPromptProps {
	/** Configuration for entity-specific text and icons */
	config: AccountPromptConfig;
	/** Usage data (optional, for showing limit warnings) */
	usage?: AccountPromptUsage | null | undefined;
	/** Whether user is authenticated */
	isAuthenticated: boolean;
	/** Variant style */
	variant?: "banner" | "card";
	/** Whether to show usage info */
	showUsage?: boolean;
	/** Whether prompt can be dismissed */
	dismissible?: boolean;
	/** Callback when signup is clicked */
	onSignup: () => void;
}

function BenefitItem({
	icon: Icon,
	label,
}: {
	icon: ComponentType<{ className?: string }>;
	label: string;
}) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 p-3 text-center">
			<Icon className="h-4 w-4 text-primary" />
			<span className="text-muted-foreground text-xs">{label}</span>
		</div>
	);
}

/**
 * Account prompt component to encourage anonymous users to create an account
 * Subtle, value-focused design that doesn't overwhelm
 */
export function AccountPrompt({
	config,
	usage,
	isAuthenticated,
	variant = "banner",
	showUsage = true,
	dismissible = true,
	onSignup,
}: AccountPromptProps) {
	const [isDismissed, setIsDismissed] = useState(false);

	if (isAuthenticated || isDismissed) {
		return null;
	}

	const isNearLimit =
		showUsage &&
		usage &&
		(usage.collectionCount >= usage.maxCollections * 0.8 ||
			Object.values(usage.itemCounts).some(
				(count: number) => count >= usage.maxItemsPerCollection * 0.8,
			));

	if (variant === "banner") {
		return (
			<div
				className={cn(
					"mb-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
					isNearLimit
						? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10"
						: "border-border bg-muted/30",
				)}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
							isNearLimit
								? "bg-amber-100 dark:bg-amber-900/30"
								: "bg-primary/10",
						)}
					>
						<Cloud
							className={cn(
								"h-4 w-4",
								isNearLimit
									? "text-amber-600 dark:text-amber-400"
									: "text-primary",
							)}
						/>
					</div>
					<div className="min-w-0">
						<p className="font-medium text-sm">
							{isNearLimit ? (
								<>
									You're approaching the limit ({usage?.collectionCount}/
									{usage?.maxCollections} {config.entityNamePlural})
								</>
							) : (
								config.syncMessage
							)}
						</p>
						<p className="text-muted-foreground text-xs">
							{isNearLimit
								? `Create a free account for up to ${config.maxLimitLabel}`
								: "Data saved in the cloud, accessible everywhere"}
						</p>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Button size="sm" onClick={onSignup}>
						Create an account
					</Button>
					{dismissible && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground"
							onClick={() => setIsDismissed(true)}
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		);
	}

	// Card variant - more detailed
	return (
		<Card className="mb-4">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-heading-3">
							{config.keepSafeTitle}
						</CardTitle>
						<CardDescription>{config.backupDescription}</CardDescription>
					</div>
					{dismissible && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 shrink-0 text-muted-foreground"
							onClick={() => setIsDismissed(true)}
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Usage indicator - only if near limit */}
				{isNearLimit && usage && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
						<p className="font-medium text-amber-700 text-sm dark:text-amber-400">
							{usage.collectionCount}/{usage.maxCollections}{" "}
							{config.entityNamePlural} used
						</p>
					</div>
				)}

				{/* Benefits - compact grid */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<BenefitItem icon={Cloud} label="Cloud backup" />
					<BenefitItem icon={Smartphone} label="Multi-device" />
					<BenefitItem icon={config.entityIcon} label={config.maxLimitLabel} />
				</div>

				<Button className="w-full" onClick={onSignup}>
					Create a free account
				</Button>
			</CardContent>
		</Card>
	);
}
