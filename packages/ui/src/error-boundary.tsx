/**
 * Error Boundary component for React
 * Catches JavaScript errors anywhere in the child component tree
 * Supports auto-recovery with exponential backoff and Sentry integration
 */

import { AlertCircle, Bug, ClipboardCopy, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "./button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./card";

export interface ErrorBoundaryLogger {
	error: (message: string, error?: unknown, data?: unknown) => void;
}

export interface SentryLike {
	captureException: (...args: unknown[]) => unknown;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	/** Custom fallback UI */
	fallback?: ReactNode | undefined;
	/** Logger instance for error reporting */
	logger?: ErrorBoundaryLogger | undefined;
	/** Sentry instance for error tracking */
	sentry?: SentryLike | undefined;
	/** Enable auto-recovery with exponential backoff */
	autoRecover?: boolean | undefined;
	/** Maximum number of auto-recovery attempts before forcing reload (default: 3) */
	maxRecoveryAttempts?: number | undefined;
	/** Component name for better error tracking */
	componentName?: string | undefined;
	/** URL for reporting errors (e.g., GitHub issues URL) */
	reportErrorUrl?: string | undefined;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorCount: number;
	isRecovering: boolean;
	copied: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	private recoveryTimeoutId: number | null = null;

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorCount: 0,
			isRecovering: false,
			copied: false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const context = this.props.componentName
			? { component: this.props.componentName }
			: undefined;

		// Log error
		this.props.logger?.error("Error Boundary caught an error", error, {
			errorInfo,
			...context,
		});

		// Send to Sentry if available
		this.props.sentry?.captureException(error, {
			contexts: {
				react: {
					componentStack: errorInfo.componentStack,
				},
			},
			tags: context,
		});

		// Auto-recovery attempt after delay (exponential backoff)
		if (this.props.autoRecover) {
			const errorCount = this.state.errorCount + 1;
			const maxAttempts = this.props.maxRecoveryAttempts ?? 3;

			if (errorCount <= maxAttempts) {
				const delay = Math.min(1000 * 2 ** (errorCount - 1), 10000); // Max 10s
				this.setState({ isRecovering: true });

				this.recoveryTimeoutId = window.setTimeout(() => {
					this.setState({
						hasError: false,
						error: null,
						errorCount,
						isRecovering: false,
					});
				}, delay);
			}
		}
	}

	override componentWillUnmount() {
		if (this.recoveryTimeoutId !== null) {
			clearTimeout(this.recoveryTimeoutId);
		}
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorCount: 0,
			isRecovering: false,
			copied: false,
		});
	};

	handleForceReload = () => {
		window.location.reload();
	};

	/**
	 * P3: Get formatted error details for copying/reporting
	 */
	getErrorDetails = (): string => {
		const error = this.state.error;
		if (!error) return "Unknown error";

		const lines = [
			`Error: ${error.message}`,
			"",
			`URL: ${window.location.href}`,
			`Time: ${new Date().toISOString()}`,
			`User Agent: ${navigator.userAgent}`,
		];

		if (this.props.componentName) {
			lines.push(`Component: ${this.props.componentName}`);
		}

		if (error.stack) {
			lines.push("", "Stack trace:", error.stack);
		}

		return lines.join("\n");
	};

	/**
	 * P3: Copy error details to clipboard
	 */
	handleCopyError = async () => {
		try {
			const details = this.getErrorDetails();
			await navigator.clipboard.writeText(details);
			this.setState({ copied: true });
			// Reset copied state after 2 seconds
			setTimeout(() => {
				this.setState({ copied: false });
			}, 2000);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = this.getErrorDetails();
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			this.setState({ copied: true });
			setTimeout(() => {
				this.setState({ copied: false });
			}, 2000);
		}
	};

	/**
	 * P3: Open error report URL with pre-filled details
	 */
	handleReportError = () => {
		const baseUrl =
			this.props.reportErrorUrl ||
			"https://github.com/appstandard/appstandard/issues/new";

		const error = this.state.error;
		const title = encodeURIComponent(
			`Bug: ${error?.message || "Unknown error"}`,
		);
		const body = encodeURIComponent(
			[
				"## Description",
				"A brief description of what you were doing when the error occurred.",
				"",
				"## Error Details",
				"```",
				this.getErrorDetails(),
				"```",
				"",
				"## Steps to Reproduce",
				"1. ",
				"2. ",
				"3. ",
				"",
				"## Expected Behavior",
				"What you expected to happen.",
			].join("\n"),
		);

		window.open(`${baseUrl}?title=${title}&body=${body}`, "_blank");
	};

	override render() {
		if (this.state.hasError) {
			const maxAttempts = this.props.maxRecoveryAttempts ?? 3;
			const autoRecover = this.props.autoRecover ?? false;

			// Too many errors - force reload
			if (autoRecover && this.state.errorCount > maxAttempts) {
				// UX-011: Mobile-optimized fallback UI with responsive padding
				return (
					<div className="container mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
						<Card className="border-destructive/50 bg-destructive/5">
							<CardHeader className="space-y-2 sm:space-y-1.5">
								<CardTitle className="flex items-center gap-2 text-destructive text-lg sm:text-xl">
									<AlertCircle
										className="h-5 w-5 shrink-0"
										aria-hidden="true"
									/>
									Multiple errors occurred
								</CardTitle>
								<CardDescription className="text-sm sm:text-base">
									The application encountered multiple errors. Please reload the
									page.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button
									onClick={this.handleForceReload}
									variant="default"
									className="w-full sm:w-auto"
								>
									Reload page
								</Button>
							</CardContent>
						</Card>
					</div>
				);
			}

			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// UX-011: Default error UI with recovery status and mobile-optimized layout
			return (
				<div className="container mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
					<Card className="border-destructive/50 bg-destructive/5">
						<CardHeader className="space-y-2 sm:space-y-1.5">
							<CardTitle className="flex items-center gap-2 text-destructive text-lg sm:text-xl">
								<AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
								An error occurred
							</CardTitle>
							<CardDescription className="text-sm sm:text-base">
								{this.state.isRecovering
									? "Attempting to recover automatically..."
									: "An unexpected error occurred. Please try again."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{this.state.error && !this.state.isRecovering && (
								<div className="break-words rounded-lg border border-destructive/20 bg-card p-3 text-sm">
									<p className="font-medium text-destructive">
										{this.state.error.message || "Unknown error"}
									</p>
								</div>
							)}

							{this.state.isRecovering && (
								// biome-ignore lint/a11y/useSemanticElements: role="status" is intentional for live announcements
								<div
									className="flex items-center gap-2 text-muted-foreground text-sm"
									role="status"
									aria-live="polite"
								>
									<RefreshCw
										className="h-4 w-4 shrink-0 animate-spin"
										aria-hidden="true"
									/>
									{/* UX-002: Show recovery attempt count for transparency */}
									<span>
										Recovering... (attempt {this.state.errorCount + 1} of{" "}
										{maxAttempts})
									</span>
								</div>
							)}

							{!this.state.isRecovering && (
								<div className="space-y-3">
									<div className="flex flex-col gap-2 sm:flex-row">
										<Button
											onClick={this.handleReset}
											variant="default"
											className="w-full sm:w-auto"
										>
											Try again
										</Button>
										<Button
											onClick={this.handleForceReload}
											variant="outline"
											className="w-full sm:w-auto"
										>
											Reload page
										</Button>
									</div>

									{/* P3: Copy and Report buttons */}
									<div className="flex flex-col gap-2 border-destructive/20 border-t pt-3 sm:flex-row">
										<Button
											onClick={this.handleCopyError}
											variant="ghost"
											size="sm"
											className="w-full justify-start gap-2 text-muted-foreground sm:w-auto"
										>
											<ClipboardCopy className="h-4 w-4" aria-hidden="true" />
											{this.state.copied ? "Copied!" : "Copy error details"}
										</Button>
										<Button
											onClick={this.handleReportError}
											variant="ghost"
											size="sm"
											className="w-full justify-start gap-2 text-muted-foreground sm:w-auto"
										>
											<Bug className="h-4 w-4" aria-hidden="true" />
											Report this error
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}
