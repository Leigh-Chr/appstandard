/**
 * Tests for the logger module
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe("in non-production mode", () => {
		beforeEach(() => {
			vi.doMock("../env", () => ({
				env: {
					NODE_ENV: "development",
				},
			}));
		});

		it("should log info messages in development", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.info("Test info message");

			// Logger combines timestamp, level, and prefix into first argument
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\] \[INFO\] \[Auth\]/),
				"Test info message",
				"",
			);

			consoleSpy.mockRestore();
		});

		it("should log info with data", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const { logger } = await import("../logger");
			const data = { userId: "123", action: "login" };
			logger.info("User action", data);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[INFO] [Auth]"),
				"User action",
				data,
			);

			consoleSpy.mockRestore();
		});

		it("should log warn messages", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.warn("Test warning");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\] \[WARN\] \[Auth\]/),
				"Test warning",
				"",
			);

			consoleSpy.mockRestore();
		});

		it("should log error messages", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.error("Test error");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\] \[ERROR\] \[Auth\]/),
				"Test error",
				"",
			);

			consoleSpy.mockRestore();
		});

		it("should log error with error object", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { logger } = await import("../logger");
			const error = new Error("Something went wrong");
			logger.error("Operation failed", { error });

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[ERROR] [Auth]"),
				"Operation failed",
				{ error },
			);

			consoleSpy.mockRestore();
		});
	});

	describe("in production mode", () => {
		beforeEach(() => {
			vi.doMock("../env", () => ({
				env: {
					NODE_ENV: "production",
				},
			}));
		});

		it("should NOT log info messages in production", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.info("This should not be logged");

			expect(consoleSpy).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should still log warn messages in production", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.warn("Warning in production");

			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should still log error messages in production", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.error("Error in production");

			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe("timestamp formatting", () => {
		it("should include ISO timestamp in logs", async () => {
			vi.doMock("../env", () => ({
				env: {
					NODE_ENV: "test",
				},
			}));

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const { logger } = await import("../logger");
			logger.warn("Test message");

			// Check that first arg contains timestamp matching ISO format
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(
					/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
				),
				expect.any(String),
				expect.any(String),
			);

			consoleSpy.mockRestore();
		});
	});
});
