/**
 * Breadcrumb - Navigation breadcrumb component
 * Displays navigation hierarchy with clickable segments
 */

import { cn } from "@appstandard/react-utils";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "./button";

export interface BreadcrumbItem {
	label: string;
	href?: string | undefined;
}

export interface BreadcrumbProps {
	items: BreadcrumbItem[];
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
	const handleClick = (href: string | undefined) => {
		if (href) {
			onNavigate(href);
		}
	};

	return (
		<nav
			aria-label="Breadcrumb"
			className={cn("flex items-center space-x-2 text-sm", className)}
		>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => handleClick(homeHref)}
				className="h-10 min-h-[44px] px-3 sm:h-8 sm:min-h-0 sm:px-2"
				aria-label={homeLabel}
			>
				<Home className="h-4 w-4" aria-hidden="true" />
			</Button>
			{items.map((item, index) => (
				<div
					key={item.href || `${item.label}-${index}`}
					className="flex items-center space-x-2"
				>
					<ChevronRight
						className="h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					{item.href ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleClick(item.href)}
							className="h-10 min-h-[44px] px-3 text-muted-foreground hover:text-foreground sm:h-8 sm:min-h-0 sm:px-2"
						>
							{item.label}
						</Button>
					) : (
						<span className="font-medium text-foreground">{item.label}</span>
					)}
				</div>
			))}
		</nav>
	);
}
