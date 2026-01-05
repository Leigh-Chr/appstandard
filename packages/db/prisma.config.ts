import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env file in development
dotenv.config({
	path: "../../apps/calendar-server/.env",
});

// DATABASE_URL is required for migrations and db:push
// For prisma generate, a placeholder URL is acceptable
const databaseUrl =
	process.env["DATABASE_URL"] ||
	"postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
	schema: path.join("prisma", "schema"),
	migrations: {
		path: path.join("prisma", "migrations"),
	},
	datasource: {
		url: databaseUrl,
	},
});
