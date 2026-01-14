/**
 * Shared application footer component
 * Uses AppConfig context for app-specific configuration
 */

import { Link } from "@tanstack/react-router";
import { Github, Heart, Shield } from "lucide-react";
import { useAppConfig } from "./app-context";

// Environment-aware privacy URL - landing app hosts the privacy policy
const isDev =
	typeof window !== "undefined" && window.location.hostname === "localhost";
const PRIVACY_URL = isDev
	? "http://localhost:3010/privacy"
	: "https://www.appstandard.io/privacy";

export function AppFooter() {
	const config = useAppConfig();
	const currentYear = new Date().getFullYear();

	return (
		<footer data-slot="app-footer" className="border-t bg-muted/30">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{/* Brand section */}
					<div className="space-y-3">
						<p className="font-semibold text-base">{config.appName}</p>
						<p className="text-muted-foreground text-sm">
							{config.description}
						</p>
						<p className="mt-3 text-muted-foreground text-xs">
							Enjoying {config.appName}?{" "}
							<a
								href="https://ko-fi.com/leigh_chr"
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-primary hover:underline"
							>
								Support the project
								<span className="sr-only"> (opens in new tab)</span>
							</a>
						</p>
					</div>

					{/* Links section */}
					<div className="space-y-3">
						<p className="font-semibold text-base">Resources</p>
						<ul className="space-y-2">
							<li>
								<Link
									to={config.mainRoute}
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									{config.mainLabel}
								</Link>
							</li>
							<li>
								<Link
									to={`${config.mainRoute}/new` as string}
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									Create {config.entityName}
								</Link>
							</li>
							<li>
								<Link
									to={`${config.mainRoute}/import` as string}
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									Import {config.entityName}s
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal & Social section */}
					<div className="space-y-3">
						<p className="font-semibold text-base">Legal & Links</p>
						<ul className="space-y-2">
							<li>
								<a
									href="https://github.com/Leigh-Chr/appstandard"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Github className="h-4 w-4" />
									GitHub
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</li>
							<li>
								<a
									href="https://ko-fi.com/leigh_chr"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
								>
									<Heart className="h-4 w-4 fill-current text-primary/70" />
									Support on Ko-fi
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</li>
							<li>
								<a
									href="https://github.com/Leigh-Chr/appstandard/blob/master/LICENSE"
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									License
									<span className="sr-only"> (opens in new tab)</span>
								</a>
							</li>
							<li>
								<a
									href={PRIVACY_URL}
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Shield className="h-4 w-4" />
									Privacy Policy
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-8 border-t pt-6 text-center">
					<p className="text-muted-foreground text-sm">
						&copy; {currentYear} {config.appName}. Open source and free to use.
					</p>
				</div>
			</div>
		</footer>
	);
}
