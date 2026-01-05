import "dotenv/config";
import { auth } from "@appstandard/auth";
import {
	createAuthHandler,
	createServerApp,
	logger,
} from "@appstandard/server-core";
import { createContext } from "@appstandard-tasks/api";
import { appRouter } from "@appstandard-tasks/api/routers/index";
import { trpcServer } from "@hono/trpc-server";
import { startCleanupJob } from "./jobs/cleanup";

// Create the server app with AppStandard Tasks-specific configuration
const { app, port, isProduction } = createServerApp({
	serviceName: "appstandard-tasks",
	defaultCorsOrigin: "http://localhost:3004",
	defaultPort: 3002,
	baseUrl: "https://tasks.appstandard.app",
	redisKeyPrefix: "ratelimit:appstandard-tasks",
	sitemapRoutes: [
		{ path: "/", changefreq: "weekly", priority: 1.0 },
		{ path: "/tasks/new", changefreq: "monthly", priority: 0.7 },
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

// Start cleanup job (production only)
if (isProduction) {
	startCleanupJob();
}

export default {
	port,
	fetch: app.fetch,
};

logger.info(`AppStandard Tasks server starting on http://localhost:${port}`);
