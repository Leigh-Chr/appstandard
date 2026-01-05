/**
 * Tests for anonymous ID utilities
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createAnonymousIdGetter,
	isValidAnonymousId,
} from "../storage/anonymous-id";

describe("isValidAnonymousId", () => {
	it("should accept valid anonymous IDs", () => {
		expect(isValidAnonymousId("anon-abc123def456ghi789jkl012mno")).toBe(true);
		expect(isValidAnonymousId("anon-ABCDEFGHIJKLMNOPQRSTUVWXYZab")).toBe(true);
		expect(isValidAnonymousId("anon-0123456789abcdefghijk")).toBe(true);
	});

	it("should accept IDs with hyphens and underscores", () => {
		expect(isValidAnonymousId("anon-abc_123-def_456-ghi_789")).toBe(true);
	});

	it("should reject IDs without anon- prefix", () => {
		expect(isValidAnonymousId("abc123def456ghi789jkl012mno")).toBe(false);
		expect(isValidAnonymousId("user-abc123def456ghi789jkl012")).toBe(false);
	});

	it("should reject IDs that are too short", () => {
		expect(isValidAnonymousId("anon-abc")).toBe(false);
		expect(isValidAnonymousId("anon-12345678901234567890")).toBe(false); // 20 chars after prefix
	});

	it("should accept IDs with minimum valid length", () => {
		// 21 characters after prefix is minimum
		expect(isValidAnonymousId("anon-123456789012345678901")).toBe(true);
	});

	it("should accept IDs up to maximum length", () => {
		// 64 characters after prefix is maximum
		expect(isValidAnonymousId(`anon-${"a".repeat(64)}`)).toBe(true);
	});

	it("should reject IDs that are too long", () => {
		expect(isValidAnonymousId(`anon-${"a".repeat(65)}`)).toBe(false);
	});

	it("should reject IDs with invalid characters", () => {
		expect(isValidAnonymousId("anon-abc123!@#$%^&*()")).toBe(false);
		expect(isValidAnonymousId("anon-abc 123 def 456 ghi")).toBe(false);
	});

	it("should reject empty strings", () => {
		expect(isValidAnonymousId("")).toBe(false);
	});

	it("should reject just the prefix", () => {
		expect(isValidAnonymousId("anon-")).toBe(false);
	});
});

describe("createAnonymousIdGetter", () => {
	const storageKey = "test-anon-id";
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		mockStorage = {};

		// Mock localStorage
		vi.stubGlobal("localStorage", {
			getItem: vi.fn((key: string) => mockStorage[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStorage[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStorage[key];
			}),
		});

		// Mock crypto.randomUUID
		vi.stubGlobal("crypto", {
			randomUUID: vi.fn(() => "12345678-1234-1234-1234-123456789012"),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("should return empty string on server (no window)", () => {
		const originalWindow = globalThis.window;
		// @ts-expect-error - testing server-side behavior
		globalThis.window = undefined;

		const getAnonymousId = createAnonymousIdGetter(storageKey);
		expect(getAnonymousId()).toBe("");

		globalThis.window = originalWindow;
	});

	it("should return existing valid ID from localStorage", () => {
		// Restore window for this test
		vi.stubGlobal("window", {});

		const existingId = "anon-abc123def456ghi789jkl012mno";
		mockStorage[storageKey] = existingId;

		const getAnonymousId = createAnonymousIdGetter(storageKey);
		expect(getAnonymousId()).toBe(existingId);
	});

	it("should generate new ID if none exists", () => {
		vi.stubGlobal("window", {});

		const getAnonymousId = createAnonymousIdGetter(storageKey);
		const id = getAnonymousId();

		expect(id).toMatch(/^anon-/);
		expect(isValidAnonymousId(id)).toBe(true);
		expect(localStorage.setItem).toHaveBeenCalled();
	});

	it("should regenerate if existing ID is invalid", () => {
		vi.stubGlobal("window", {});

		mockStorage[storageKey] = "invalid-id";

		const getAnonymousId = createAnonymousIdGetter(storageKey);
		const id = getAnonymousId();

		expect(id).toMatch(/^anon-/);
		expect(isValidAnonymousId(id)).toBe(true);
	});

	it("should store generated ID in localStorage", () => {
		vi.stubGlobal("window", {});

		const getAnonymousId = createAnonymousIdGetter(storageKey);
		getAnonymousId();

		expect(localStorage.setItem).toHaveBeenCalledWith(
			storageKey,
			expect.stringMatching(/^anon-/),
		);
	});

	it("should use different storage keys for different apps", () => {
		vi.stubGlobal("window", {});

		const getId1 = createAnonymousIdGetter("app1-anon-id");
		const getId2 = createAnonymousIdGetter("app2-anon-id");

		const _id1 = getId1();
		const _id2 = getId2();

		// Both should be generated (mocked UUID is same, but both should call setItem)
		expect(localStorage.setItem).toHaveBeenCalledWith(
			"app1-anon-id",
			expect.any(String),
		);
		expect(localStorage.setItem).toHaveBeenCalledWith(
			"app2-anon-id",
			expect.any(String),
		);
	});
});
