/**
 * API-004: OpenAPI/API documentation generator for tRPC routers
 *
 * Generates a JSON description of all available tRPC procedures.
 * This is a lightweight alternative to full OpenAPI generation that
 * works with tRPC v11 without external dependencies.
 *
 * @example
 * const docs = generateApiDocs(appRouter, { title: 'AppStandard Calendar API' });
 */

import type { AnyTRPCRouter } from "@trpc/server";

export interface ApiDocsProcedure {
	/** Full path to the procedure (e.g., "calendar.list") */
	path: string;
	/** Type of procedure */
	type: "query" | "mutation" | "subscription";
	/** Description if available from procedure meta */
	description?: string;
	/** Whether authentication is required */
	requiresAuth?: boolean;
}

export interface ApiDocsInfo {
	title: string;
	version: string;
	description?: string;
}

export interface ApiDocsOutput {
	info: ApiDocsInfo;
	basePath: string;
	procedures: ApiDocsProcedure[];
	generatedAt: string;
}

export interface GenerateApiDocsOptions {
	/** API title */
	title: string;
	/** API version */
	version?: string;
	/** API description */
	description?: string;
	/** Base path for tRPC endpoints (default: "/trpc") */
	basePath?: string;
}

/**
 * Extract procedures from a tRPC router recursively
 */
function extractProcedures(
	router: AnyTRPCRouter,
	prefix = "",
): ApiDocsProcedure[] {
	const procedures: ApiDocsProcedure[] = [];

	// Access the internal router structure
	const routerDef = router._def as {
		procedures?: Record<string, unknown>;
		router?: boolean;
	};

	if (!routerDef.procedures) {
		return procedures;
	}

	for (const [key, value] of Object.entries(routerDef.procedures)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const proc = value as {
			_def?: {
				type?: string;
				meta?: { description?: string; requiresAuth?: boolean };
				query?: unknown;
				mutation?: unknown;
				subscription?: unknown;
			};
			_def_?: unknown;
		};

		// Check if this is a nested router or a procedure
		if (proc && typeof proc === "object" && "_def" in proc) {
			const def = proc._def;

			// Determine procedure type
			let type: "query" | "mutation" | "subscription" = "query";
			if (def?.type === "mutation" || def?.mutation) {
				type = "mutation";
			} else if (def?.type === "subscription" || def?.subscription) {
				type = "subscription";
			}

			procedures.push({
				path,
				type,
				description: def?.meta?.description,
				requiresAuth: def?.meta?.requiresAuth,
			});
		}
	}

	return procedures;
}

/**
 * Generate API documentation from a tRPC router
 */
export function generateApiDocs(
	router: AnyTRPCRouter,
	options: GenerateApiDocsOptions,
): ApiDocsOutput {
	const procedures = extractProcedures(router);

	return {
		info: {
			title: options.title,
			version: options.version || "1.0.0",
			description: options.description,
		},
		basePath: options.basePath || "/trpc",
		procedures: procedures.sort((a, b) => a.path.localeCompare(b.path)),
		generatedAt: new Date().toISOString(),
	};
}

/**
 * Generate a simple OpenAPI 3.0 compatible spec from tRPC procedures
 * This generates a basic spec that describes the RPC-style API
 */
export function generateOpenApiSpec(
	router: AnyTRPCRouter,
	options: GenerateApiDocsOptions & { serverUrl?: string },
): object {
	const docs = generateApiDocs(router, options);

	const paths: Record<string, object> = {};

	for (const proc of docs.procedures) {
		const pathKey = `${docs.basePath}/${proc.path}`;

		if (proc.type === "query") {
			paths[pathKey] = {
				get: {
					summary: proc.description || `Query: ${proc.path}`,
					operationId: proc.path.replace(/\./g, "_"),
					tags: [proc.path.split(".")[0] || "default"],
					parameters: [
						{
							name: "input",
							in: "query",
							required: false,
							description: "JSON-encoded input parameters",
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Successful response",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											result: {
												type: "object",
												properties: {
													data: { type: "object" },
												},
											},
										},
									},
								},
							},
						},
					},
				},
			};
		} else if (proc.type === "mutation") {
			paths[pathKey] = {
				post: {
					summary: proc.description || `Mutation: ${proc.path}`,
					operationId: proc.path.replace(/\./g, "_"),
					tags: [proc.path.split(".")[0] || "default"],
					requestBody: {
						required: false,
						content: {
							"application/json": {
								schema: {
									type: "object",
									description: "Input parameters for the mutation",
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Successful response",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											result: {
												type: "object",
												properties: {
													data: { type: "object" },
												},
											},
										},
									},
								},
							},
						},
					},
				},
			};
		}
	}

	return {
		openapi: "3.0.3",
		info: {
			title: docs.info.title,
			version: docs.info.version,
			description:
				docs.info.description ||
				"tRPC API documentation. Use the tRPC client for type-safe access.",
		},
		servers: options.serverUrl ? [{ url: options.serverUrl }] : [],
		paths,
		tags: [
			...new Set(docs.procedures.map((p) => p.path.split(".")[0] || "default")),
		].map((tag) => ({ name: tag })),
	};
}
