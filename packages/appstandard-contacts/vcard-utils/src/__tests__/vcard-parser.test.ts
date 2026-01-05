/**
 * Tests for vCard parser
 */
import { describe, expect, it } from "vitest";
import { parseVCardFile } from "../parser/vcard-parser";

describe("parseVCardFile", () => {
	describe("basic parsing", () => {
		it("should parse a minimal vCard", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.errors).toHaveLength(0);
			expect(result.contacts).toHaveLength(1);
			expect(result.contacts[0].formattedName).toBe("John Doe");
		});

		it("should parse multiple vCards", () => {
			const vcards = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
END:VCARD
BEGIN:VCARD
VERSION:4.0
FN:Jane Smith
END:VCARD`;

			const result = parseVCardFile(vcards);
			expect(result.errors).toHaveLength(0);
			expect(result.contacts).toHaveLength(2);
			expect(result.contacts[0].formattedName).toBe("John Doe");
			expect(result.contacts[1].formattedName).toBe("Jane Smith");
		});

		it("should handle CRLF line endings", () => {
			const vcard = "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:John Doe\r\nEND:VCARD";

			const result = parseVCardFile(vcard);
			expect(result.errors).toHaveLength(0);
			expect(result.contacts).toHaveLength(1);
		});

		it("should handle folded lines", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
NOTE:This is a very long note that has been folded according to RFC 6350 rul
 es for line folding
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.errors).toHaveLength(0);
			expect(result.contacts[0].note).toContain(
				"This is a very long note that has been folded",
			);
		});

		it("should report error for missing FN property", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
N:Doe;John;;;
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("FN");
		});

		it("should report error for empty file", () => {
			const result = parseVCardFile("");
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.contacts).toHaveLength(0);
		});

		it("should report error for file without vCards", () => {
			const result = parseVCardFile("Some random text");
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe("name properties", () => {
		it("should parse N (structured name)", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:Dr. John Michael Doe Jr.
N:Doe;John;Michael;Dr.;Jr.
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.familyName).toBe("Doe");
			expect(contact.givenName).toBe("John");
			expect(contact.additionalName).toBe("Michael");
			expect(contact.namePrefix).toBe("Dr.");
			expect(contact.nameSuffix).toBe("Jr.");
		});

		it("should parse NICKNAME", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
NICKNAME:Johnny
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].nickname).toBe("Johnny");
		});
	});

	describe("contact methods", () => {
		it("should parse EMAIL with type", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
EMAIL;TYPE=work:john@company.com
EMAIL;TYPE=home;PREF=1:john@home.com
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.emails).toHaveLength(2);
			expect(contact.emails?.[0].email).toBe("john@company.com");
			expect(contact.emails?.[0].type).toBe("work");
			expect(contact.emails?.[1].email).toBe("john@home.com");
			expect(contact.emails?.[1].isPrimary).toBe(true);
		});

		it("should parse TEL with type", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
TEL;TYPE=cell:+1-555-123-4567
TEL;TYPE=work;PREF=1:+1-555-987-6543
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.phones).toHaveLength(2);
			expect(contact.phones?.[0].number).toBe("+1-555-123-4567");
			expect(contact.phones?.[0].type).toBe("cell");
			expect(contact.phones?.[1].isPrimary).toBe(true);
		});

		it("should parse ADR with components", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
ADR;TYPE=home:;;123 Main St;New York;NY;10001;USA
END:VCARD`;

			const result = parseVCardFile(vcard);
			const address = result.contacts[0].addresses?.[0];
			expect(address?.streetAddress).toBe("123 Main St");
			expect(address?.locality).toBe("New York");
			expect(address?.region).toBe("NY");
			expect(address?.postalCode).toBe("10001");
			expect(address?.country).toBe("USA");
			expect(address?.type).toBe("home");
		});
	});

	describe("organization properties", () => {
		it("should parse ORG", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
ORG:Acme Corp;Engineering
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].organization).toBe("Acme Corp");
		});

		it("should parse TITLE", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
TITLE:Senior Engineer
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].title).toBe("Senior Engineer");
		});

		it("should parse ROLE", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
ROLE:Project Manager
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].role).toBe("Project Manager");
		});
	});

	describe("date properties", () => {
		it("should parse BDAY", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
BDAY:19900615
END:VCARD`;

			const result = parseVCardFile(vcard);
			const birthday = result.contacts[0].birthday;
			expect(birthday).toBeDefined();
			expect(birthday?.getFullYear()).toBe(1990);
			expect(birthday?.getMonth()).toBe(5); // June
			expect(birthday?.getDate()).toBe(15);
		});

		it("should parse ANNIVERSARY", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
ANNIVERSARY:2015-08-20
END:VCARD`;

			const result = parseVCardFile(vcard);
			const anniversary = result.contacts[0].anniversary;
			expect(anniversary).toBeDefined();
			expect(anniversary?.getFullYear()).toBe(2015);
		});
	});

	describe("geography properties", () => {
		it("should parse GEO with geo: URI", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
GEO:geo:40.7128,-74.0060
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.geoLatitude).toBeCloseTo(40.7128);
			expect(contact.geoLongitude).toBeCloseTo(-74.006);
		});

		it("should parse GEO with semicolon separator", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
GEO:40.7128;-74.0060
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.geoLatitude).toBeCloseTo(40.7128);
			expect(contact.geoLongitude).toBeCloseTo(-74.006);
		});

		it("should parse TZ", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
TZ:America/New_York
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].timezone).toBe("America/New_York");
		});
	});

	describe("enum properties", () => {
		it("should parse GENDER", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
GENDER:M
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].gender).toBe("M");
		});

		it("should parse KIND", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:Engineering Team
KIND:group
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].kind).toBe("group");
		});
	});

	describe("additional properties", () => {
		it("should parse CATEGORIES", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
CATEGORIES:Work,Friends,Family
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].categories).toEqual([
				"Work",
				"Friends",
				"Family",
			]);
		});

		it("should parse NOTE with escaped characters", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
NOTE:Line1\\nLine2\\; with semicolon
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].note).toBe("Line1\nLine2; with semicolon");
		});

		it("should parse URL", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
URL:https://example.com
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].url).toBe("https://example.com");
		});

		it("should parse UID", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
UID:urn:uuid:12345678-1234-1234-1234-123456789abc
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].uid).toBe(
				"urn:uuid:12345678-1234-1234-1234-123456789abc",
			);
		});

		it("should parse IMPP", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
IMPP:xmpp:john@jabber.org
IMPP:skype:john.doe
END:VCARD`;

			const result = parseVCardFile(vcard);
			const imHandles = result.contacts[0].imHandles;
			expect(imHandles).toHaveLength(2);
			expect(imHandles?.[0].service).toBe("xmpp");
			expect(imHandles?.[0].handle).toBe("john@jabber.org");
			expect(imHandles?.[1].service).toBe("skype");
		});

		it("should parse RELATED", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
RELATED;TYPE=spouse:Jane Doe
END:VCARD`;

			const result = parseVCardFile(vcard);
			const relations = result.contacts[0].relations;
			expect(relations).toHaveLength(1);
			expect(relations?.[0].relatedName).toBe("Jane Doe");
			expect(relations?.[0].relationType).toBe("spouse");
		});

		it("should parse PHOTO URI", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
PHOTO;VALUE=URI:https://example.com/photo.jpg
END:VCARD`;

			const result = parseVCardFile(vcard);
			expect(result.contacts[0].photoUrl).toBe("https://example.com/photo.jpg");
		});

		it("should parse LANG", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
LANG;PREF=1:en
LANG:fr
END:VCARD`;

			const result = parseVCardFile(vcard);
			const languages = result.contacts[0].languages;
			expect(languages).toHaveLength(2);
			expect(languages?.[0].tag).toBe("en");
			expect(languages?.[0].isPrimary).toBe(true);
			expect(languages?.[1].tag).toBe("fr");
		});

		it("should parse KEY", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
KEY;VALUE=URI:https://example.com/key.pub
END:VCARD`;

			const result = parseVCardFile(vcard);
			const keys = result.contacts[0].keys;
			expect(keys).toHaveLength(1);
			expect(keys?.[0].uri).toBe("https://example.com/key.pub");
		});

		it("should parse calendar URIs", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
FBURL:https://example.com/freebusy
CALADRURI:mailto:calendar@example.com
CALURI:https://example.com/calendar.ics
END:VCARD`;

			const result = parseVCardFile(vcard);
			const contact = result.contacts[0];
			expect(contact.fbUrls?.[0].uri).toBe("https://example.com/freebusy");
			expect(contact.calAdrUris?.[0].uri).toBe("mailto:calendar@example.com");
			expect(contact.calUris?.[0].uri).toBe("https://example.com/calendar.ics");
		});

		it("should parse MEMBER for groups", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:Engineering Team
KIND:group
MEMBER:urn:uuid:123
MEMBER:urn:uuid:456
END:VCARD`;

			const result = parseVCardFile(vcard);
			const members = result.contacts[0].members;
			expect(members).toHaveLength(2);
			expect(members).toContain("urn:uuid:123");
			expect(members).toContain("urn:uuid:456");
		});
	});

	describe("social profile extensions", () => {
		it("should parse X-SOCIALPROFILE", () => {
			const vcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
X-SOCIALPROFILE;TYPE=twitter:https://twitter.com/johndoe
END:VCARD`;

			const result = parseVCardFile(vcard);
			const imHandles = result.contacts[0].imHandles;
			expect(imHandles).toHaveLength(1);
			expect(imHandles?.[0].service).toBe("twitter");
		});
	});
});
