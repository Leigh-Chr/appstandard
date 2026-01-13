import "dotenv/config";
import { createContext } from "@appstandard/api/context";
import {
	generateApiDocs,
	generateOpenApiSpec,
} from "@appstandard/api/lib/openapi";
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

// API-004: API documentation endpoints
const apiDocsOptions = {
	title: "AppStandard Calendar API",
	version: "1.0.0",
	description:
		"Calendar management API. Use the tRPC client for type-safe access, or the HTTP RPC endpoints directly.",
	basePath: "/trpc",
};

// Simple API docs endpoint (lightweight JSON)
app.get("/api/docs", (c) => {
	const docs = generateApiDocs(appRouter, apiDocsOptions);
	return c.json(docs);
});

// OpenAPI 3.0 spec endpoint
app.get("/api/openapi.json", (c) => {
	const serverUrl = c.req.header("host")
		? `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host")}`
		: undefined;
	const spec = generateOpenApiSpec(appRouter, { ...apiDocsOptions, serverUrl });
	return c.json(spec);
});

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
