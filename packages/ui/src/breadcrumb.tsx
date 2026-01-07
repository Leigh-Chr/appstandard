/**
 * Breadcrumb - Navigation breadcrumb component
 * High-level convenience component built on shadcn/radix primitives
 * Displays navigation hierarchy with clickable segments
 */

import { cn } from "@appstandard/react-utils";
import { Home } from "lucide-react";
import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbRoot,
	BreadcrumbSeparator,
} from "./breadcrumb-primitives";
import { Button } from "./button";

export interface BreadcrumbItemData {
	label: string;
	href?: string | undefined;
}

export interface BreadcrumbProps {
	items: BreadcrumbItemData[];
	homeHref: string;
	homeLabel?: string | undefined;
	onNavigate: (href: string) => void;
	className?: string | undefined;
}

export function Breadcrumb({
	items,
	homeHref,
	homeLabel = "Home",
	onNavigate,
	className,
}: BreadcrumbProps) {
	const handleClick = (e: React.MouseEvent, href: string | undefined) => {
		if (href) {
			e.preventDefault();
			onNavigate(href);
		}
	};

	return (
		<BreadcrumbRoot className={cn("flex items-center", className)}>
			<BreadcrumbList>
				{/* Home item */}
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => handleClick(e, homeHref)}
							className="h-10 min-h-[44px] px-3 sm:h-8 sm:min-h-0 sm:px-2"
							aria-label={homeLabel}
						>
							<Home className="h-4 w-4" aria-hidden="true" />
						</Button>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{/* Dynamic items */}
				{items.map((item, index) => (
					<span
						key={item.href || `${item.label}-${index}`}
						className="contents"
					>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{item.href ? (
								<BreadcrumbLink asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => handleClick(e, item.href)}
										className="h-10 min-h-[44px] px-3 text-muted-foreground hover:text-foreground sm:h-8 sm:min-h-0 sm:px-2"
									>
										{item.label}
									</Button>
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage className="font-medium">
									{item.label}
								</BreadcrumbPage>
							)}
						</BreadcrumbItem>
					</span>
				))}
			</BreadcrumbList>
		</BreadcrumbRoot>
	);
}

// Re-export primitives for direct use (prefixed to avoid conflicts)
export {
	BreadcrumbEllipsis,
	BreadcrumbItem as BreadcrumbListItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbRoot,
	BreadcrumbSeparator,
} from "./breadcrumb-primitives";

// Legacy type export for backward compatibility
export type { BreadcrumbItemData as BreadcrumbItem };
