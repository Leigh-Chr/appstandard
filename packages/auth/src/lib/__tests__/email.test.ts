/**
 * Tests for email sending functions
 * Tests the email module with mocked Resend client
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Wait for fire-and-forget email operations to complete.
 * The email module intentionally doesn't await Resend API calls
 * to prevent timing attacks. Tests need to wait for the .then()
 * chains to execute before asserting.
 */
const flushEmailPromises = () =>
	new Promise((resolve) => setTimeout(resolve, 10));

describe("sendVerificationEmail", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should call Resend with correct parameters", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendVerificationEmail } = await import("../email");

		await sendVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/verify?token=abc123",
			token: "abc123",
		});

		// Wait for the async .then() chain to complete
		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				subject: "Verify your email address - AppStandard Calendar",
			}),
		);
	});

	it("should include verification URL in email body", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendVerificationEmail } = await import("../email");
		const testUrl = "https://example.com/verify?token=test-token";

		await sendVerificationEmail({
			to: "user@example.com",
			url: testUrl,
			token: "test-token",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining(testUrl),
				text: expect.stringContaining(testUrl),
			}),
		);
	});
});

describe("sendDeleteAccountVerificationEmail", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should send delete account email with correct subject", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendDeleteAccountVerificationEmail } = await import("../email");

		await sendDeleteAccountVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/delete?token=abc123",
			token: "abc123",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				subject: "Confirm account deletion - AppStandard Calendar",
			}),
		);
	});

	it("should include warning about irreversible action", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendDeleteAccountVerificationEmail } = await import("../email");

		await sendDeleteAccountVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/delete",
			token: "token",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining("irreversible"),
				text: expect.stringContaining("IRREVERSIBLE"),
			}),
		);
	});
});

describe("sendResetPasswordEmail", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should send password reset email with correct subject", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendResetPasswordEmail } = await import("../email");

		await sendResetPasswordEmail({
			to: "user@example.com",
			url: "https://example.com/reset?token=abc123",
			token: "abc123",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				subject: "Reset your password - AppStandard Calendar",
			}),
		);
	});

	it("should include reset URL in email", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendResetPasswordEmail } = await import("../email");
		const testUrl = "https://example.com/reset?token=reset-token";

		await sendResetPasswordEmail({
			to: "user@example.com",
			url: testUrl,
			token: "reset-token",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining(testUrl),
				text: expect.stringContaining(testUrl),
			}),
		);
	});
});

describe("sendGroupInvitationEmail", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should send group invitation with correct subject", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendGroupInvitationEmail } = await import("../email");

		await sendGroupInvitationEmail({
			to: "user@example.com",
			groupName: "Team Calendar",
			inviterName: "John Doe",
			acceptUrl: "https://example.com/accept",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				subject: expect.stringContaining("Team Calendar"),
			}),
		);
	});

	it("should include inviter name and group name in email body", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendGroupInvitationEmail } = await import("../email");

		await sendGroupInvitationEmail({
			to: "user@example.com",
			groupName: "Marketing Team",
			inviterName: "Jane Smith",
			acceptUrl: "https://example.com/accept",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining("Jane Smith"),
				text: expect.stringContaining("Jane Smith"),
			}),
		);
		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining("Marketing Team"),
				text: expect.stringContaining("Marketing Team"),
			}),
		);
	});

	it("should include accept URL in email", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendGroupInvitationEmail } = await import("../email");
		const acceptUrl = "https://example.com/groups/123/accept";

		await sendGroupInvitationEmail({
			to: "user@example.com",
			groupName: "Test Group",
			inviterName: "Test User",
			acceptUrl,
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				html: expect.stringContaining(acceptUrl),
				text: expect.stringContaining(acceptUrl),
			}),
		);
	});
});

describe("email without Resend configured", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should log error when RESEND_API_KEY is not set", async () => {
		const mockLoggerError = vi.fn();

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: vi.fn(),
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: undefined, // No API key
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: mockLoggerError,
			},
		}));

		const { sendVerificationEmail } = await import("../email");

		await sendVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/verify",
			token: "token",
		});

		expect(mockLoggerError).toHaveBeenCalledWith(
			expect.stringContaining("RESEND_API_KEY is not configured"),
		);
	});

	it("should not throw when Resend is not configured", async () => {
		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: vi.fn(),
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: undefined,
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendResetPasswordEmail } = await import("../email");

		// Should not throw
		await expect(
			sendResetPasswordEmail({
				to: "user@example.com",
				url: "https://example.com/reset",
				token: "token",
			}),
		).resolves.toBeUndefined();
	});
});

describe("email error handling", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should log error when email send fails", async () => {
		const mockLoggerError = vi.fn();
		const mockSendFn = vi.fn().mockResolvedValue({
			data: null,
			error: { message: "Rate limit exceeded" },
		});

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: mockLoggerError,
			},
		}));

		const { sendVerificationEmail } = await import("../email");

		await sendVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/verify",
			token: "token",
		});

		// Wait for the async .then() chain to complete
		await flushEmailPromises();

		expect(mockLoggerError).toHaveBeenCalledWith(
			expect.stringContaining("Failed to send verification email"),
			expect.objectContaining({
				to: "user@example.com",
			}),
		);
	});

	it("should log error when send throws exception", async () => {
		const mockLoggerError = vi.fn();
		const mockSendFn = vi.fn().mockRejectedValue(new Error("Network error"));

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: mockLoggerError,
			},
		}));

		const { sendResetPasswordEmail } = await import("../email");

		await sendResetPasswordEmail({
			to: "user@example.com",
			url: "https://example.com/reset",
			token: "token",
		});

		// Wait for the async catch to complete
		await flushEmailPromises();

		expect(mockLoggerError).toHaveBeenCalledWith(
			expect.stringContaining("Error sending"),
			expect.objectContaining({
				to: "user@example.com",
			}),
		);
	});

	it("should log success on successful send", async () => {
		const mockLoggerInfo = vi.fn();
		const mockSendFn = vi.fn().mockResolvedValue({
			data: { id: "success-id" },
			error: null,
		});

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "sender@test.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: mockLoggerInfo,
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendGroupInvitationEmail } = await import("../email");

		await sendGroupInvitationEmail({
			to: "user@example.com",
			groupName: "Test Group",
			inviterName: "Inviter",
			acceptUrl: "https://example.com/accept",
		});

		// Wait for the async .then() chain to complete
		await flushEmailPromises();

		expect(mockLoggerInfo).toHaveBeenCalledWith(
			expect.stringContaining("sent successfully"),
			expect.objectContaining({
				to: "user@example.com",
				emailId: "success-id",
			}),
		);
	});
});

describe("email from address", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should use EMAIL_FROM when provided", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: "custom@sender.com",
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendVerificationEmail } = await import("../email");

		await sendVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/verify",
			token: "token",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "custom@sender.com",
			}),
		);
	});

	it("should use default from address when EMAIL_FROM is not set", async () => {
		const mockSendFn = vi
			.fn()
			.mockResolvedValue({ data: { id: "test-id" }, error: null });

		vi.doMock("resend", () => ({
			Resend: class MockResend {
				emails = {
					send: mockSendFn,
				};
			},
		}));

		vi.doMock("../env", () => ({
			env: {
				RESEND_API_KEY: "test-key",
				EMAIL_FROM: undefined,
				NODE_ENV: "test",
			},
		}));

		vi.doMock("../logger", () => ({
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}));

		const { sendVerificationEmail } = await import("../email");

		await sendVerificationEmail({
			to: "user@example.com",
			url: "https://example.com/verify",
			token: "token",
		});

		await flushEmailPromises();

		expect(mockSendFn).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "AppStandard Calendar <noreply@appstandard.com>",
			}),
		);
	});
});
