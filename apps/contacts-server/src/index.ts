import "dotenv/config";
import { auth } from "@appstandard/auth";
import {
	createAuthHandler,
	createServerApp,
	logger,
} from "@appstandard/server-core";
import { createContext } from "@appstandard-contacts/api";
import { appRouter } from "@appstandard-contacts/api/routers/index";
import { trpcServer } from "@hono/trpc-server";
import { startCleanupJob } from "./jobs/cleanup";

// Create the server app with AppStandard Contacts-specific configuration
const { app, port, isProduction } = createServerApp({
	serviceName: "appstandard-contacts",
	defaultCorsOrigin: "http://localhost:3005",
	defaultPort: 3003,
	baseUrl: "https://contacts.appstandard.app",
	redisKeyPrefix: "ratelimit:appstandard-contacts",
	sitemapRoutes: [
		{ path: "/", changefreq: "weekly", priority: 1.0 },
		{ path: "/contacts/new", changefreq: "monthly", priority: 0.7 },
		{ path: "/contacts/import", changefreq: "monthly", priority: 0.7 },
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

logger.info(
	`AppStandard Contacts API server starting on http://localhost:${port}`,
);
