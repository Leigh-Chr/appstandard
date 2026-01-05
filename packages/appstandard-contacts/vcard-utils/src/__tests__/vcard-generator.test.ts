/**
 * Tests for vCard generator
 */
import { describe, expect, it } from "vitest";
import {
	generateSingleVCard,
	generateVCardFile,
} from "../generator/vcard-generator";
import type { ContactInput } from "../types";

describe("generateVCardFile", () => {
	describe("basic generation", () => {
		it("should generate a minimal vCard", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("BEGIN:VCARD");
			expect(result).toContain("VERSION:4.0");
			expect(result).toContain("FN:John Doe");
			expect(result).toContain("END:VCARD");
		});

		it("should generate multiple vCards", () => {
			const contacts: ContactInput[] = [
				{ formattedName: "John Doe" },
				{ formattedName: "Jane Smith" },
			];

			const result = generateVCardFile({ contacts });
			expect(result.match(/BEGIN:VCARD/g)).toHaveLength(2);
			expect(result.match(/END:VCARD/g)).toHaveLength(2);
			expect(result).toContain("FN:John Doe");
			expect(result).toContain("FN:Jane Smith");
		});

		it("should return empty string for empty contacts array", () => {
			const result = generateVCardFile({ contacts: [] });
			expect(result).toBe("");
		});

		it("should include custom PRODID", () => {
			const contacts: ContactInput[] = [{ formattedName: "John Doe" }];
			const result = generateVCardFile({
				contacts,
				prodId: "-//Custom App//EN",
			});
			expect(result).toContain("PRODID:-//Custom App//EN");
		});

		it("should include UID", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					uid: "urn:uuid:12345",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("UID:urn:uuid:12345");
		});

		it("should generate UID if not provided", () => {
			const contacts: ContactInput[] = [{ formattedName: "John Doe" }];
			const result = generateVCardFile({ contacts });
			expect(result).toMatch(/UID:urn:uuid:[0-9a-f-]+/);
		});

		it("should include REV timestamp", () => {
			const contacts: ContactInput[] = [{ formattedName: "John Doe" }];
			const result = generateVCardFile({ contacts });
			expect(result).toMatch(/REV:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
		});
	});

	describe("name properties", () => {
		it("should generate N property", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "Dr. John M. Doe Jr.",
					familyName: "Doe",
					givenName: "John",
					additionalName: "Michael",
					namePrefix: "Dr.",
					nameSuffix: "Jr.",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("N:Doe;John;Michael;Dr.;Jr.");
		});

		it("should generate NICKNAME", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					nickname: "Johnny",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("NICKNAME:Johnny");
		});

		it("should escape special characters in name", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John; Doe, Jr.",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("FN:John\\; Doe\\, Jr.");
		});
	});

	describe("contact methods", () => {
		it("should generate EMAIL with type and preference", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					emails: [
						{ email: "john@work.com", type: "work" },
						{ email: "john@home.com", type: "home", isPrimary: true },
					],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("EMAIL;TYPE=WORK:john@work.com");
			expect(result).toContain("EMAIL;TYPE=HOME;PREF=1:john@home.com");
		});

		it("should generate TEL with type and preference", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					phones: [
						{ number: "+1-555-1234", type: "cell", isPrimary: true },
						{ number: "+1-555-5678", type: "work" },
					],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain(
				"TEL;VALUE=uri;TYPE=CELL;PREF=1:tel:+1-555-1234",
			);
			expect(result).toContain("TEL;VALUE=uri;TYPE=WORK:tel:+1-555-5678");
		});

		it("should format phone number as tel: URI", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					phones: [{ number: "+1 555 1234" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("tel:+15551234");
		});

		it("should not duplicate tel: prefix", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					phones: [{ number: "tel:+15551234" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain(":tel:+15551234");
			expect(result).not.toContain("tel:tel:");
		});

		it("should generate ADR with all components", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					addresses: [
						{
							type: "home",
							poBox: "PO Box 123",
							extendedAddress: "Suite 100",
							streetAddress: "123 Main St",
							locality: "New York",
							region: "NY",
							postalCode: "10001",
							country: "USA",
							isPrimary: true,
						},
					],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("ADR;TYPE=HOME;PREF=1:");
			expect(result).toContain(
				"PO Box 123;Suite 100;123 Main St;New York;NY;10001;USA",
			);
		});
	});

	describe("organization properties", () => {
		it("should generate ORG", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					organization: "Acme Corp",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("ORG:Acme Corp");
		});

		it("should generate TITLE", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					title: "Senior Engineer",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("TITLE:Senior Engineer");
		});

		it("should generate ROLE", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					role: "Project Lead",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("ROLE:Project Lead");
		});

		it("should generate LOGO", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					logoUrl: "https://example.com/logo.png",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("LOGO;VALUE=URI:https://example.com/logo.png");
		});

		it("should generate MEMBER for groups", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "Team",
					kind: "group",
					members: ["urn:uuid:123", "urn:uuid:456"],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("KIND:group");
			expect(result).toContain("MEMBER:urn:uuid:123");
			expect(result).toContain("MEMBER:urn:uuid:456");
		});
	});

	describe("date properties", () => {
		it("should generate BDAY", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					birthday: new Date(1990, 5, 15),
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("BDAY:19900615");
		});

		it("should generate ANNIVERSARY", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					anniversary: new Date(2015, 7, 20),
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("ANNIVERSARY:20150820");
		});
	});

	describe("geography properties", () => {
		it("should generate GEO", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					geoLatitude: 40.7128,
					geoLongitude: -74.006,
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("GEO:geo:40.7128,-74.006");
		});

		it("should generate TZ", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					timezone: "America/New_York",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("TZ:America/New_York");
		});
	});

	describe("enum properties", () => {
		it("should generate GENDER", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					gender: "M",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("GENDER:M");
		});

		it("should generate KIND", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "Acme Corp",
					kind: "org",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("KIND:org");
		});
	});

	describe("additional properties", () => {
		it("should generate PHOTO", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					photoUrl: "https://example.com/photo.jpg",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("PHOTO;VALUE=URI:https://example.com/photo.jpg");
		});

		it("should generate NOTE with escaping", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					note: "Line1\nLine2; with semicolon",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("NOTE:Line1\\nLine2\\; with semicolon");
		});

		it("should generate URL", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					url: "https://example.com",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("URL:https://example.com");
		});

		it("should generate CATEGORIES", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					categories: ["Work", "Friends", "Family"],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("CATEGORIES:Work,Friends,Family");
		});

		it("should generate IMPP", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					imHandles: [
						{ service: "xmpp", handle: "john@jabber.org" },
						{ service: "skype", handle: "john.doe" },
					],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("IMPP:xmpp:john@jabber.org");
			expect(result).toContain("IMPP:skype:john.doe");
		});

		it("should handle IMPP with URI in handle", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					imHandles: [{ service: "xmpp", handle: "xmpp:john@jabber.org" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("IMPP:xmpp:john@jabber.org");
		});

		it("should generate RELATED", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					relations: [{ relatedName: "Jane Doe", relationType: "spouse" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("RELATED;TYPE=spouse:Jane Doe");
		});

		it("should generate LANG", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					languages: [{ tag: "en", isPrimary: true }, { tag: "fr" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("LANG;PREF=1:en");
			expect(result).toContain("LANG:fr");
		});

		it("should generate KEY with URI", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					keys: [{ uri: "https://example.com/key.pub", type: "pgp" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain(
				"KEY;VALUE=URI;MEDIATYPE=application/pgp-keys:https://example.com/key.pub",
			);
		});

		it("should generate KEY with inline value", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					keys: [{ value: "PUBLIC KEY DATA" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("KEY:PUBLIC KEY DATA");
		});

		it("should generate SOUND", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					soundUrl: "https://example.com/name.mp3",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("SOUND;VALUE=URI:https://example.com/name.mp3");
		});

		it("should generate SOURCE", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					sourceUrl: "https://example.com/contact.vcf",
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("SOURCE:https://example.com/contact.vcf");
		});

		it("should generate calendar URIs", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					fbUrls: [{ uri: "https://example.com/freebusy", type: "work" }],
					calAdrUris: [{ uri: "mailto:calendar@example.com", isPrimary: true }],
					calUris: [{ uri: "https://example.com/calendar.ics" }],
				},
			];

			const result = generateVCardFile({ contacts });
			expect(result).toContain("FBURL;TYPE=WORK:https://example.com/freebusy");
			expect(result).toContain("CALADRURI;PREF=1:mailto:calendar@example.com");
			expect(result).toContain("CALURI:https://example.com/calendar.ics");
		});
	});

	describe("line folding", () => {
		it("should fold long lines", () => {
			const contacts: ContactInput[] = [
				{
					formattedName: "John Doe",
					note: "A".repeat(100),
				},
			];

			const result = generateVCardFile({ contacts });
			const lines = result.split("\r\n");
			const noteLine = lines.find((l) => l.startsWith("NOTE:"));
			expect(noteLine?.length).toBeLessThanOrEqual(75);
		});
	});
});

describe("generateSingleVCard", () => {
	it("should generate a single vCard", () => {
		const contact: ContactInput = {
			formattedName: "John Doe",
			emails: [{ email: "john@example.com" }],
		};

		const result = generateSingleVCard(contact);
		expect(result).toContain("BEGIN:VCARD");
		expect(result).toContain("FN:John Doe");
		expect(result).toContain("EMAIL:john@example.com");
		expect(result).toContain("END:VCARD");
	});

	it("should use custom prodId", () => {
		const contact: ContactInput = { formattedName: "John Doe" };
		const result = generateSingleVCard(contact, "-//My App//EN");
		expect(result).toContain("PRODID:-//My App//EN");
	});
});
