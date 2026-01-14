/**
 * App logo component that displays either a logo image or falls back to an icon
 * Provides consistent logo rendering across the application
 */

import { cn } from "@appstandard/react-utils";
import { createElement } from "react";
import { useAppConfig } from "./app-context";

export interface AppLogoProps {
	/** Size class for the logo (e.g., "size-5", "size-7", "h-8 w-8") */
	className?: string;
	/** Override the logo source from config */
	logoSrc?: string;
	/** Whether to hide from screen readers */
	ariaHidden?: boolean;
}

/**
 * Renders the app logo - prefers image if logoSrc is available, falls back to icon
 */
export function AppLogo({
	className = "size-6",
	logoSrc: logoSrcProp,
	ariaHidden = true,
}: AppLogoProps) {
	const config = useAppConfig();
	const logoSrc = logoSrcProp ?? config.logoSrc;

	if (logoSrc) {
		return (
			<img
				src={logoSrc}
				alt=""
				className={cn(className)}
				aria-hidden={ariaHidden}
			/>
		);
	}

	// Fallback to icon
	if (config.appIcon) {
		return createElement(config.appIcon, {
			className: cn(className, "text-primary"),
			"aria-hidden": ariaHidden,
		});
	}

	return null;
}
