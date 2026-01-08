/**
 * Account prompt for Contacts app
 * Uses shared AccountPrompt component with contacts-specific configuration
 */

import {
	type AccountPromptConfig,
	type AccountPromptUsage,
	AccountPrompt as SharedAccountPrompt,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Book } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-storage";
import { trpc } from "@/utils/trpc";

const CONTACTS_CONFIG: AccountPromptConfig = {
	entityNamePlural: "address books",
	entityIcon: Book,
	maxLimitLabel: "100 address books",
	syncMessage: "Sync your contacts across all your devices",
	keepSafeTitle: "Keep your contacts safe",
	backupDescription: "Back up your address books in the cloud",
};

interface AccountPromptProps {
	variant?: "banner" | "card";
	showUsage?: boolean;
	dismissible?: boolean;
}

export function AccountPrompt({
	variant = "banner",
	showUsage = true,
	dismissible = true,
}: AccountPromptProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();

	const { data: rawUsage } = useQuery({
		...trpc.addressBook.getUsage.queryOptions(),
		enabled: !isAuthenticated && showUsage,
	});

	// Transform to normalized usage format
	const usage: AccountPromptUsage | undefined = rawUsage
		? {
				collectionCount: rawUsage.addressBookCount,
				maxCollections: rawUsage.maxAddressBooks,
				itemCounts: rawUsage.contactCounts,
				maxItemsPerCollection: rawUsage.maxContactsPerAddressBook,
			}
		: undefined;

	const handleSignup = () => {
		navigate({
			to: "/login",
			search: { mode: "signup", redirect: location.pathname },
		});
	};

	return (
		<SharedAccountPrompt
			config={CONTACTS_CONFIG}
			usage={usage}
			isAuthenticated={isAuthenticated}
			variant={variant}
			showUsage={showUsage}
			dismissible={dismissible}
			onSignup={handleSignup}
		/>
	);
}
