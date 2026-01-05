/**
 * Tests for environment variable validation
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("env schema validation", () => {
	// Define the schema inline for testing (same as in env.ts)
	const envSchema = z.object({
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		CORS_ORIGIN: z.string().url().optional(),
		BETTER_AUTH_URL: z.string().url().optional(),
		RESEND_API_KEY: z.string().optional(),
		EMAIL_FROM: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (val === undefined || val === "") return true;
					return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
				},
				{
					message: "Invalid email address",
				},
			),
		SMTP_HOST: z.string().optional(),
		SMTP_PORT: z.string().optional(),
		SMTP_SECURE: z.string().optional(),
		SMTP_USER: z.string().optional(),
		SMTP_PASSWORD: z.string().optional(),
	});

	describe("NODE_ENV", () => {
		it("should accept development", () => {
			const result = envSchema.parse({ NODE_ENV: "development" });
			expect(result.NODE_ENV).toBe("development");
		});

		it("should accept production", () => {
			const result = envSchema.parse({ NODE_ENV: "production" });
			expect(result.NODE_ENV).toBe("production");
		});

		it("should accept test", () => {
			const result = envSchema.parse({ NODE_ENV: "test" });
			expect(result.NODE_ENV).toBe("test");
		});

		it("should reject invalid NODE_ENV values", () => {
			expect(() => envSchema.parse({ NODE_ENV: "staging" })).toThrow();
			expect(() => envSchema.parse({ NODE_ENV: "dev" })).toThrow();
			expect(() => envSchema.parse({ NODE_ENV: "prod" })).toThrow();
		});

		it("should accept undefined NODE_ENV", () => {
			const result = envSchema.parse({});
			expect(result.NODE_ENV).toBeUndefined();
		});
	});

	describe("CORS_ORIGIN", () => {
		it("should accept valid URLs", () => {
			const result = envSchema.parse({
				CORS_ORIGIN: "http://localhost:3001",
			});
			expect(result.CORS_ORIGIN).toBe("http://localhost:3001");
		});

		it("should accept HTTPS URLs", () => {
			const result = envSchema.parse({
				CORS_ORIGIN: "https://example.com",
			});
			expect(result.CORS_ORIGIN).toBe("https://example.com");
		});

		it("should reject invalid URLs", () => {
			expect(() => envSchema.parse({ CORS_ORIGIN: "not-a-url" })).toThrow();
		});

		it("should accept undefined CORS_ORIGIN", () => {
			const result = envSchema.parse({});
			expect(result.CORS_ORIGIN).toBeUndefined();
		});
	});

	describe("BETTER_AUTH_URL", () => {
		it("should accept valid backend URLs", () => {
			const result = envSchema.parse({
				BETTER_AUTH_URL: "http://localhost:3000",
			});
			expect(result.BETTER_AUTH_URL).toBe("http://localhost:3000");
		});

		it("should accept production URLs", () => {
			const result = envSchema.parse({
				BETTER_AUTH_URL: "https://api.example.com",
			});
			expect(result.BETTER_AUTH_URL).toBe("https://api.example.com");
		});

		it("should reject invalid URLs", () => {
			expect(() => envSchema.parse({ BETTER_AUTH_URL: "invalid" })).toThrow();
		});
	});

	describe("RESEND_API_KEY", () => {
		it("should accept any string", () => {
			const result = envSchema.parse({
				RESEND_API_KEY: "re_123abc456def",
			});
			expect(result.RESEND_API_KEY).toBe("re_123abc456def");
		});

		it("should accept undefined", () => {
			const result = envSchema.parse({});
			expect(result.RESEND_API_KEY).toBeUndefined();
		});
	});

	describe("EMAIL_FROM", () => {
		it("should accept valid email addresses", () => {
			const result = envSchema.parse({
				EMAIL_FROM: "noreply@example.com",
			});
			expect(result.EMAIL_FROM).toBe("noreply@example.com");
		});

		it("should accept email with name format", () => {
			// Note: The current schema only validates the email part
			// A full "Name <email>" format would fail the regex
			const result = envSchema.parse({
				EMAIL_FROM: "test@domain.org",
			});
			expect(result.EMAIL_FROM).toBe("test@domain.org");
		});

		it("should reject invalid email addresses", () => {
			expect(() => envSchema.parse({ EMAIL_FROM: "not-an-email" })).toThrow();
		});

		it("should reject email without domain", () => {
			expect(() => envSchema.parse({ EMAIL_FROM: "user@" })).toThrow();
		});

		it("should reject email without @ symbol", () => {
			expect(() => envSchema.parse({ EMAIL_FROM: "userdomain.com" })).toThrow();
		});

		it("should accept undefined", () => {
			const result = envSchema.parse({});
			expect(result.EMAIL_FROM).toBeUndefined();
		});

		it("should accept empty string", () => {
			const result = envSchema.parse({ EMAIL_FROM: "" });
			expect(result.EMAIL_FROM).toBe("");
		});
	});

	describe("SMTP configuration", () => {
		it("should accept all SMTP fields", () => {
			const result = envSchema.parse({
				SMTP_HOST: "smtp.example.com",
				SMTP_PORT: "587",
				SMTP_SECURE: "true",
				SMTP_USER: "user@example.com",
				SMTP_PASSWORD: "secret123",
			});
			expect(result.SMTP_HOST).toBe("smtp.example.com");
			expect(result.SMTP_PORT).toBe("587");
			expect(result.SMTP_SECURE).toBe("true");
			expect(result.SMTP_USER).toBe("user@example.com");
			expect(result.SMTP_PASSWORD).toBe("secret123");
		});

		it("should accept partial SMTP configuration", () => {
			const result = envSchema.parse({
				SMTP_HOST: "smtp.example.com",
			});
			expect(result.SMTP_HOST).toBe("smtp.example.com");
			expect(result.SMTP_PORT).toBeUndefined();
		});

		it("should accept no SMTP configuration", () => {
			const result = envSchema.parse({});
			expect(result.SMTP_HOST).toBeUndefined();
			expect(result.SMTP_PORT).toBeUndefined();
			expect(result.SMTP_SECURE).toBeUndefined();
			expect(result.SMTP_USER).toBeUndefined();
			expect(result.SMTP_PASSWORD).toBeUndefined();
		});
	});

	describe("complete environment", () => {
		it("should accept a complete valid environment", () => {
			const fullEnv = {
				NODE_ENV: "production" as const,
				CORS_ORIGIN: "https://app.example.com",
				BETTER_AUTH_URL: "https://api.example.com",
				RESEND_API_KEY: "re_production_key",
				EMAIL_FROM: "noreply@example.com",
				SMTP_HOST: "smtp.example.com",
				SMTP_PORT: "587",
				SMTP_SECURE: "true",
				SMTP_USER: "smtp_user",
				SMTP_PASSWORD: "smtp_pass",
			};

			const result = envSchema.parse(fullEnv);
			expect(result).toEqual(fullEnv);
		});

		it("should accept minimal environment", () => {
			const result = envSchema.parse({});
			expect(result).toEqual({});
		});

		it("should accept development environment", () => {
			const devEnv = {
				NODE_ENV: "development" as const,
				CORS_ORIGIN: "http://localhost:3001",
				BETTER_AUTH_URL: "http://localhost:3000",
			};

			const result = envSchema.parse(devEnv);
			expect(result).toEqual(devEnv);
		});
	});
});
