/**
 * Recoverable Error Boundary for Tasks app
 * Uses the shared ErrorBoundary from @appstandard/ui with app-specific configuration
 */

import { ErrorBoundary, type SentryLike } from "@appstandard/ui";
import * as Sentry from "@sentry/react";
import type { ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props {
	children: ReactNode;
	fallback?: ReactNode | undefined;
	maxRecoveryAttempts?: number | undefined;
	componentName?: string | undefined;
}

export function RecoverableErrorBoundary({
	children,
	fallback,
	maxRecoveryAttempts = 3,
	componentName,
}: Props) {
	return (
		<ErrorBoundary
			fallback={fallback}
			logger={logger}
			sentry={Sentry as unknown as SentryLike}
			autoRecover={true}
			maxRecoveryAttempts={maxRecoveryAttempts}
			componentName={componentName}
		>
			{children}
		</ErrorBoundary>
	);
}
