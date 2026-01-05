/**
 * Tests for Circuit Breaker pattern
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CircuitBreaker,
	createUrlImportCircuitBreaker,
} from "../circuit-breaker";

// Mock the logger to avoid console output during tests
vi.mock("../logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe("CircuitBreaker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("initial state", () => {
		it("should start in CLOSED state", () => {
			const breaker = new CircuitBreaker();
			expect(breaker.getState()).toBe("CLOSED");
		});

		it("should start with zero failures", () => {
			const breaker = new CircuitBreaker();
			expect(breaker.getFailureCount()).toBe(0);
		});

		it("should use default options", () => {
			const breaker = new CircuitBreaker();
			expect(breaker.getState()).toBe("CLOSED");
			expect(breaker.getFailureCount()).toBe(0);
		});

		it("should accept custom options", () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 3,
				resetTimeout: 30000,
				name: "TestBreaker",
			});
			expect(breaker.getState()).toBe("CLOSED");
		});
	});

	describe("CLOSED state", () => {
		it("should execute functions successfully", async () => {
			const breaker = new CircuitBreaker();
			const result = await breaker.execute(async () => "success");
			expect(result).toBe("success");
		});

		it("should remain CLOSED after successful executions", async () => {
			const breaker = new CircuitBreaker();
			await breaker.execute(async () => "success");
			await breaker.execute(async () => "success");
			expect(breaker.getState()).toBe("CLOSED");
			expect(breaker.getFailureCount()).toBe(0);
		});

		it("should increment failure count on errors", async () => {
			const breaker = new CircuitBreaker();
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow("test error");
			expect(breaker.getFailureCount()).toBe(1);
		});

		it("should remain CLOSED below threshold", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 5 });

			for (let i = 0; i < 4; i++) {
				await expect(
					breaker.execute(async () => {
						throw new Error("test error");
					}),
				).rejects.toThrow();
			}

			expect(breaker.getFailureCount()).toBe(4);
			expect(breaker.getState()).toBe("CLOSED");
		});

		it("should transition to OPEN at threshold", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 3 });

			for (let i = 0; i < 3; i++) {
				await expect(
					breaker.execute(async () => {
						throw new Error("test error");
					}),
				).rejects.toThrow();
			}

			expect(breaker.getState()).toBe("OPEN");
		});

		it("should reset failure count on success", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 5 });

			// Accumulate some failures
			for (let i = 0; i < 3; i++) {
				await expect(
					breaker.execute(async () => {
						throw new Error("test error");
					}),
				).rejects.toThrow();
			}
			expect(breaker.getFailureCount()).toBe(3);

			// Successful call should reset
			await breaker.execute(async () => "success");
			expect(breaker.getFailureCount()).toBe(0);
		});
	});

	describe("OPEN state", () => {
		it("should reject requests immediately", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow("test error");

			expect(breaker.getState()).toBe("OPEN");

			// Subsequent requests should fail immediately
			await expect(breaker.execute(async () => "success")).rejects.toThrow(
				"External service is temporarily unavailable",
			);
		});

		it("should not execute the function when OPEN", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			const fn = vi.fn().mockResolvedValue("success");
			await expect(breaker.execute(fn)).rejects.toThrow();
			expect(fn).not.toHaveBeenCalled();
		});

		it("should transition to HALF_OPEN after timeout", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			expect(breaker.getState()).toBe("OPEN");

			// Advance time past reset timeout
			vi.advanceTimersByTime(61000);

			// Next request should be attempted (state transitions on request)
			await breaker.execute(async () => "success");
			expect(breaker.getState()).toBe("CLOSED");
		});
	});

	describe("HALF_OPEN state", () => {
		it("should allow one request through", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			// Advance time
			vi.advanceTimersByTime(61000);

			// Execute and succeed
			const result = await breaker.execute(async () => "recovered");
			expect(result).toBe("recovered");
		});

		it("should transition to CLOSED on success", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			// Advance time
			vi.advanceTimersByTime(61000);

			// Succeed - should close circuit
			await breaker.execute(async () => "success");
			expect(breaker.getState()).toBe("CLOSED");
			expect(breaker.getFailureCount()).toBe(0);
		});

		it("should transition back to OPEN on failure", async () => {
			const breaker = new CircuitBreaker({
				failureThreshold: 1,
				resetTimeout: 60000,
			});

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			// Advance time to transition to HALF_OPEN
			vi.advanceTimersByTime(61000);

			// Fail again - should reopen circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("still failing");
				}),
			).rejects.toThrow("still failing");

			expect(breaker.getState()).toBe("OPEN");
		});
	});

	describe("reset", () => {
		it("should reset to CLOSED state", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 1 });

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			expect(breaker.getState()).toBe("OPEN");

			// Manual reset
			breaker.reset();

			expect(breaker.getState()).toBe("CLOSED");
			expect(breaker.getFailureCount()).toBe(0);
		});

		it("should allow requests after reset", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 1 });

			// Open the circuit
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();

			breaker.reset();

			const result = await breaker.execute(async () => "success after reset");
			expect(result).toBe("success after reset");
		});
	});

	describe("error propagation", () => {
		it("should propagate the original error", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 5 });
			const customError = new Error("custom error message");

			await expect(
				breaker.execute(async () => {
					throw customError;
				}),
			).rejects.toBe(customError);
		});

		it("should propagate error objects with custom properties", async () => {
			const breaker = new CircuitBreaker({ failureThreshold: 5 });

			class CustomError extends Error {
				code = "CUSTOM_CODE";
			}

			try {
				await breaker.execute(async () => {
					throw new CustomError("custom");
				});
			} catch (error) {
				expect(error).toBeInstanceOf(CustomError);
				expect((error as CustomError).code).toBe("CUSTOM_CODE");
			}
		});
	});
});

describe("createUrlImportCircuitBreaker", () => {
	it("should create a circuit breaker with correct name", () => {
		const breaker = createUrlImportCircuitBreaker("Calendar");
		expect(breaker).toBeInstanceOf(CircuitBreaker);
	});

	it("should use failureThreshold of 5", async () => {
		const breaker = createUrlImportCircuitBreaker("Test");

		// Should remain closed after 4 failures
		for (let i = 0; i < 4; i++) {
			await expect(
				breaker.execute(async () => {
					throw new Error("test error");
				}),
			).rejects.toThrow();
		}
		expect(breaker.getState()).toBe("CLOSED");

		// 5th failure should open it
		await expect(
			breaker.execute(async () => {
				throw new Error("test error");
			}),
		).rejects.toThrow();
		expect(breaker.getState()).toBe("OPEN");
	});
});
