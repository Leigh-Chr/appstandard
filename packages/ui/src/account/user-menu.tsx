/**
 * Shared User Menu Component
 * Dropdown menu for authenticated users
 */

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Settings } from "lucide-react";

import { useAppConfig } from "../app-context";
import type { AuthClient } from "../auth/types";
import { Button } from "../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../dropdown-menu";
import { Skeleton } from "../skeleton";

export interface UserMenuProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Show dashboard link (default: true) */
	showDashboardLink?: boolean | undefined;
	/** Custom menu items to add before sign out */
	additionalItems?: React.ReactNode | undefined;
}

export function UserMenu({
	authClient,
	showDashboardLink = true,
	additionalItems,
}: UserMenuProps) {
	const config = useAppConfig();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link
					to="/login"
					search={{ mode: "signin", redirect: location.pathname }}
				>
					Sign in
				</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">{session.user.name}</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>My account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled>{session.user.email}</DropdownMenuItem>
				<DropdownMenuSeparator />
				{showDashboardLink && (
					<DropdownMenuItem asChild>
						<Link to="/dashboard" className="flex items-center gap-2">
							<LayoutDashboard className="h-4 w-4" />
							Dashboard
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem asChild>
					<Link to="/account" className="flex items-center gap-2">
						<Settings className="h-4 w-4" />
						Account settings
					</Link>
				</DropdownMenuItem>
				{additionalItems}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									const currentPath = location.pathname;
									if (
										currentPath.startsWith("/account") ||
										currentPath.startsWith(config.protectedRoutePrefix)
									) {
										navigate({ to: config.mainRoute });
									} else if (currentPath === "/") {
										navigate({ to: "/" });
									} else {
										navigate({ to: "/" });
									}
								},
							},
						});
					}}
					className="text-destructive focus:text-destructive"
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
