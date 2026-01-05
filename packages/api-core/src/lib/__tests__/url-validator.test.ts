/**
 * Tests for URL validator - SSRF protection
 */
import { describe, expect, it } from "vitest";
import { assertValidExternalUrl, validateExternalUrl } from "../url-validator";

describe("validateExternalUrl", () => {
	describe("valid URLs", () => {
		it("should accept valid HTTPS URLs", () => {
			expect(validateExternalUrl("https://example.com/path")).toEqual({
				valid: true,
			});
		});

		it("should accept valid HTTP URLs", () => {
			expect(validateExternalUrl("http://example.com/path")).toEqual({
				valid: true,
			});
		});

		it("should accept URLs with ports", () => {
			expect(validateExternalUrl("https://example.com:8080/path")).toEqual({
				valid: true,
			});
		});

		it("should accept URLs with query strings", () => {
			expect(
				validateExternalUrl("https://example.com/path?key=value&foo=bar"),
			).toEqual({ valid: true });
		});

		it("should accept external IP addresses", () => {
			expect(validateExternalUrl("https://203.0.113.50/api")).toEqual({
				valid: true,
			});
		});
	});

	describe("invalid URLs", () => {
		it("should reject malformed URLs", () => {
			const result = validateExternalUrl("not-a-url");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Invalid URL");
		});

		it("should reject empty strings", () => {
			const result = validateExternalUrl("");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Invalid URL");
		});
	});

	describe("protocol restrictions", () => {
		it("should reject FTP protocol", () => {
			const result = validateExternalUrl("ftp://example.com/file");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Only HTTP and HTTPS protocols are allowed");
		});

		it("should reject file protocol", () => {
			const result = validateExternalUrl("file:///etc/passwd");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Only HTTP and HTTPS protocols are allowed");
		});

		it("should reject javascript protocol", () => {
			const result = validateExternalUrl("javascript:alert(1)");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Only HTTP and HTTPS protocols are allowed");
		});

		it("should reject data protocol", () => {
			const result = validateExternalUrl(
				"data:text/html,<script>alert(1)</script>",
			);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Only HTTP and HTTPS protocols are allowed");
		});
	});

	describe("localhost protection", () => {
		it("should reject localhost", () => {
			const result = validateExternalUrl("http://localhost/api");
			expect(result.valid).toBe(false);
			// Note: localhost is in BLOCKED_HOSTNAMES so it's caught by cloud metadata check first
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject localhost with port", () => {
			const result = validateExternalUrl("http://localhost:3000/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject .localhost subdomains", () => {
			const result = validateExternalUrl("http://app.localhost/api");
			expect(result.valid).toBe(false);
			// Subdomains of localhost are caught by the .endsWith(".localhost") check
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject .local domains", () => {
			const result = validateExternalUrl("http://server.local/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to localhost not allowed");
		});
	});

	describe("private IPv4 protection", () => {
		it("should reject 127.0.0.1 (loopback)", () => {
			const result = validateExternalUrl("http://127.0.0.1/api");
			expect(result.valid).toBe(false);
			// Note: 127.0.0.1 is in BLOCKED_HOSTNAMES so it's caught by cloud metadata check first
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject 127.x.x.x range", () => {
			const result = validateExternalUrl("http://127.0.0.2/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should reject 10.x.x.x range", () => {
			const result = validateExternalUrl("http://10.0.0.1/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should reject 10.255.255.255", () => {
			const result = validateExternalUrl("http://10.255.255.255/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should reject 172.16.x.x range", () => {
			const result = validateExternalUrl("http://172.16.0.1/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should reject 172.31.255.255", () => {
			const result = validateExternalUrl("http://172.31.255.255/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should accept 172.15.x.x (not in private range)", () => {
			const result = validateExternalUrl("http://172.15.0.1/api");
			expect(result.valid).toBe(true);
		});

		it("should accept 172.32.x.x (not in private range)", () => {
			const result = validateExternalUrl("http://172.32.0.1/api");
			expect(result.valid).toBe(true);
		});

		it("should reject 192.168.x.x range", () => {
			const result = validateExternalUrl("http://192.168.1.1/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});

		it("should reject 0.0.0.0", () => {
			const result = validateExternalUrl("http://0.0.0.0/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject 169.254.x.x (link-local)", () => {
			const result = validateExternalUrl("http://169.254.1.1/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IP addresses not allowed");
		});
	});

	describe("private IPv6 protection", () => {
		it("should reject ::1 (loopback)", () => {
			const result = validateExternalUrl("http://[::1]/api");
			expect(result.valid).toBe(false);
			// Note: [::1] is in BLOCKED_HOSTNAMES so it's caught by cloud metadata check first
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject :: (unspecified)", () => {
			const result = validateExternalUrl("http://[::]/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject fe80:: (link-local)", () => {
			const result = validateExternalUrl("http://[fe80::1]/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IPv6 addresses not allowed");
		});

		it("should reject fc00:: (unique local)", () => {
			const result = validateExternalUrl("http://[fc00::1]/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IPv6 addresses not allowed");
		});

		it("should reject fd00:: (unique local)", () => {
			const result = validateExternalUrl("http://[fd00::1]/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IPv6 addresses not allowed");
		});
	});

	describe("cloud metadata protection", () => {
		it("should reject AWS/GCP/Azure metadata endpoint", () => {
			const result = validateExternalUrl(
				"http://169.254.169.254/latest/meta-data",
			);
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject AWS ECS metadata endpoint", () => {
			const result = validateExternalUrl("http://169.254.170.2/v2/credentials");
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject GCP metadata endpoint by hostname", () => {
			const result = validateExternalUrl(
				"http://metadata.google.internal/computeMetadata",
			);
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject metadata.google", () => {
			const result = validateExternalUrl(
				"http://metadata.google/computeMetadata",
			);
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should reject AWS IPv6 metadata endpoint", () => {
			const result = validateExternalUrl(
				"http://[fd00:ec2::254]/latest/meta-data",
			);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Access to private IPv6 addresses not allowed");
		});
	});

	describe("case sensitivity", () => {
		it("should handle uppercase hostnames", () => {
			const result = validateExternalUrl("http://LOCALHOST/api");
			expect(result.valid).toBe(false);
			// LOCALHOST is normalized to lowercase and caught by BLOCKED_HOSTNAMES
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});

		it("should handle mixed case metadata hostnames", () => {
			const result = validateExternalUrl("http://Metadata.Google.Internal/api");
			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Access to cloud metadata services not allowed",
			);
		});
	});
});

describe("assertValidExternalUrl", () => {
	it("should not throw for valid URLs", () => {
		expect(() => assertValidExternalUrl("https://example.com")).not.toThrow();
	});

	it("should throw TRPCError for invalid URLs", () => {
		expect(() => assertValidExternalUrl("http://localhost")).toThrow();
	});

	it("should throw with correct error message", () => {
		try {
			assertValidExternalUrl("http://10.0.0.1");
		} catch (error) {
			expect(error).toHaveProperty("code", "BAD_REQUEST");
			expect(error).toHaveProperty(
				"message",
				"Access to private IP addresses not allowed",
			);
		}
	});
});
