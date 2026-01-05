/**
 * Client-side logger
 * Uses Sentry in production, console in development
 */

import { createLogger } from "@appstandard/react-utils";
import * as Sentry from "@sentry/react";

export const logger = createLogger({
	sentry: Sentry,
	prefix: "AppStandard Calendar",
});
