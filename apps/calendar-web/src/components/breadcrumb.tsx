/**
 * Breadcrumb wrapper for Calendar app
 * Uses shared Breadcrumb component from @appstandard/ui
 */

import {
	type BreadcrumbItem,
	Breadcrumb as SharedBreadcrumb,
} from "@appstandard/ui";
import { useLocation, useRouter } from "@tanstack/react-router";

interface BreadcrumbProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
	const router = useRouter();
	const location = useLocation();

	const handleNavigate = (href: string) => {
		if (href !== location.pathname) {
			router.history.push(href);
		}
	};

	return (
		<SharedBreadcrumb
			items={items}
			homeHref="/calendars"
			homeLabel="Home - My calendars"
			onNavigate={handleNavigate}
			className={className}
		/>
	);
}
