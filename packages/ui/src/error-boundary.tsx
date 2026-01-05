/**
 * Error Boundary component for React
 * Catches JavaScript errors anywhere in the child component tree
 * Supports auto-recovery with exponential backoff and Sentry integration
 */

import { AlertCircle, RefreshCw } from "lucide-react";
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
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorCount: number;
	isRecovering: boolean;
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
		});
	};

	handleForceReload = () => {
		window.location.reload();
	};

	override render() {
		if (this.state.hasError) {
			const maxAttempts = this.props.maxRecoveryAttempts ?? 3;
			const autoRecover = this.props.autoRecover ?? false;

			// Too many errors - force reload
			if (autoRecover && this.state.errorCount > maxAttempts) {
				return (
					<div className="container mx-auto max-w-2xl px-4 py-10">
						<Card className="border-destructive/50 bg-destructive/5">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-destructive">
									<AlertCircle className="h-5 w-5" aria-hidden="true" />
									Multiple errors occurred
								</CardTitle>
								<CardDescription>
									The application encountered multiple errors. Please reload the
									page.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button onClick={this.handleForceReload} variant="default">
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

			// Default error UI with recovery status
			return (
				<div className="container mx-auto max-w-2xl px-4 py-10">
					<Card className="border-destructive/50 bg-destructive/5">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-destructive">
								<AlertCircle className="h-5 w-5" aria-hidden="true" />
								An error occurred
							</CardTitle>
							<CardDescription>
								{this.state.isRecovering
									? "Attempting to recover automatically..."
									: "An unexpected error occurred. Please try again."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{this.state.error && !this.state.isRecovering && (
								<div className="rounded-lg border border-destructive/20 bg-card p-3 text-sm">
									<p className="font-medium text-destructive">
										{this.state.error.message || "Unknown error"}
									</p>
								</div>
							)}

							{this.state.isRecovering && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<RefreshCw className="h-4 w-4 animate-spin" />
									Recovering...
								</div>
							)}

							{!this.state.isRecovering && (
								<div className="flex gap-2">
									<Button onClick={this.handleReset} variant="default">
										Try again
									</Button>
									<Button onClick={this.handleForceReload} variant="outline">
										Reload page
									</Button>
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
