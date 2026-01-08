import "dotenv/config";
import { createContext } from "@appstandard/api/context";
import { appRouter } from "@appstandard/api/routers/index";
import { auth } from "@appstandard/auth";
import {
	createAuthHandler,
	createServerApp,
	logger,
} from "@appstandard/server-core";
import { trpcServer } from "@hono/trpc-server";
import { startCleanupJob } from "./jobs/cleanup";

// Create the server app with AppStandard Calendar-specific configuration
const { app, port, isProduction } = createServerApp({
	serviceName: "appstandard",
	defaultCorsOrigin: "http://localhost:3001",
	defaultPort: 3000,
	baseUrl: "https://calendar.appstandard.io",
	redisKeyPrefix: "ratelimit",
	sitemapRoutes: [
		{ path: "/", changefreq: "weekly", priority: 1.0 },
		{ path: "/calendars/new", changefreq: "monthly", priority: 0.7 },
		{ path: "/calendars/import", changefreq: "monthly", priority: 0.7 },
		{ path: "/login", changefreq: "monthly", priority: 0.5 },
	],
});

// Better-Auth handler for auth endpoints
app.all("/api/auth/*", createAuthHandler(auth));

// tRPC server
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

// Start cleanup job for orphaned anonymous calendars (production only)
if (isProduction) {
	startCleanupJob();
}

export default {
	port,
	fetch: app.fetch,
};

logger.info(`Server starting on http://localhost:${port}`);
