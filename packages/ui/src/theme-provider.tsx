import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * Theme provider wrapper for next-themes
 * Provides consistent theming across AppStandard Calendar applications
 * Accepts all props from NextThemesProvider
 */
export function ThemeProvider({
	children,
	attribute = "class",
	defaultTheme = "system",
	storageKey = "theme",
	enableSystem = true,
	disableTransitionOnChange = true,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider
			attribute={attribute}
			defaultTheme={defaultTheme}
			storageKey={storageKey}
			enableSystem={enableSystem}
			disableTransitionOnChange={disableTransitionOnChange}
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}

// Re-export useTheme for convenience
export { useTheme } from "next-themes";
