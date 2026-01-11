/**
 * Privacy middleware for GPC (Global Privacy Control) detection
 * Detects Sec-GPC and DNT headers and adds response headers
 */

import type { Context, MiddlewareHandler } from "hono";
import { logger } from "../lib/logger";

/**
 * Privacy state available via c.get('privacy')
 */
export interface PrivacyState {
	/** True if Sec-GPC: 1 header was detected */
	gpcEnabled: boolean;
	/** True if DNT: 1 header was detected */
	doNotTrack: boolean;
}

/**
 * Augment Hono's context types to include privacy state
 */
declare module "hono" {
	interface ContextVariableMap {
		privacy: PrivacyState;
	}
}

/**
 * Privacy middleware that detects GPC and DNT signals
 *
 * - Detects Sec-GPC: 1 header (Global Privacy Control)
 * - Detects DNT: 1 header (Do Not Track)
 * - Echoes Sec-GPC: 1 in response when detected
 * - Logs GPC detection for compliance records
 *
 * @example
 * ```ts
 * import { privacyMiddleware } from '@appstandard/server-core/middleware/privacy';
 *
 * app.use('*', privacyMiddleware());
 *
 * // In handlers:
 * const { gpcEnabled, doNotTrack } = c.get('privacy');
 * ```
 */
export function privacyMiddleware(): MiddlewareHandler {
	return async (c: Context, next) => {
		// Detect privacy signals from headers
		const gpcHeader = c.req.header("Sec-GPC");
		const dntHeader = c.req.header("DNT");

		const gpcEnabled = gpcHeader === "1";
		const doNotTrack = dntHeader === "1";

		// Set privacy state for downstream handlers
		c.set("privacy", {
			gpcEnabled,
			doNotTrack,
		});

		// Echo GPC header in response per spec
		if (gpcEnabled) {
			c.header("Sec-GPC", "1");

			// Log GPC detection for compliance records (no PII)
			logger.info("[gpc_detected]", {
				path: c.req.path,
				method: c.req.method,
			});
		}

		await next();
	};
}
