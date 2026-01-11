import { createFileRoute } from "@tanstack/react-router";
import { FileText, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPolicyPage,
	head: () => ({
		meta: [
			{ title: "Privacy Policy - AppStandard" },
			{
				name: "description",
				content:
					"AppStandard Privacy Policy - Learn how we collect, use, and protect your personal data. GDPR compliant.",
			},
		],
	}),
});

const POLICY_VERSION = "1.1.0";
const LAST_UPDATED = "January 11, 2026";
const CONTACT_EMAIL = "privacy@appstandard.io";

function PrivacyPolicyPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
			{/* Header */}
			<header className="mb-12 text-center">
				<div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
					<Shield className="size-8 text-primary" aria-hidden="true" />
				</div>
				<h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">
					Privacy Policy
				</h1>
				<p className="text-muted-foreground">
					Version {POLICY_VERSION} | Last updated: {LAST_UPDATED}
				</p>
			</header>

			{/* Quick Summary */}
			<section className="mb-12 rounded-xl border bg-muted/30 p-6">
				<h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
					<FileText className="size-5 text-primary" aria-hidden="true" />
					Summary
				</h2>
				<ul className="space-y-2 text-muted-foreground">
					<li>
						<strong className="text-foreground">We collect minimal data</strong>{" "}
						- only what's needed to provide our services
					</li>
					<li>
						<strong className="text-foreground">
							No advertising or tracking
						</strong>{" "}
						- we don't sell your data or show you ads
					</li>
					<li>
						<strong className="text-foreground">You control your data</strong> -
						export, delete, or modify anytime
					</li>
					<li>
						<strong className="text-foreground">Open source</strong> - audit our
						code to verify our practices
					</li>
				</ul>
			</section>

			{/* Main Content */}
			<article className="prose prose-zinc dark:prose-invert max-w-none">
				{/* 1. Data Controller */}
				<section>
					<h2>1. Who We Are</h2>
					<p>
						AppStandard is an open-source productivity suite providing calendar,
						contacts, and task management applications. This privacy policy
						explains how we handle your personal data.
					</p>
					<p>
						<strong>Data Controller:</strong> AppStandard
						<br />
						<strong>Contact:</strong>{" "}
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
					</p>
				</section>

				{/* 2. Data We Collect */}
				<section>
					<h2>2. What Data We Collect</h2>

					<h3>Account Information (if you create an account)</h3>
					<ul>
						<li>Email address - for authentication and account recovery</li>
						<li>Name (optional) - for personalization</li>
						<li>Password - stored securely using industry-standard hashing</li>
					</ul>

					<h3>Your Content</h3>
					<ul>
						<li>
							<strong>Calendar data:</strong> Events, dates, times,
							descriptions, attendees, and calendar settings
						</li>
						<li>
							<strong>Contacts:</strong> Names, email addresses, phone numbers,
							addresses, and other contact details you provide
						</li>
						<li>
							<strong>Tasks:</strong> Task names, descriptions, due dates,
							priorities, and completion status
						</li>
					</ul>

					<h3>Technical Data</h3>
					<ul>
						<li>
							<strong>Error reports:</strong> When errors occur, we may collect
							technical information to fix bugs (browser type, error messages).
							All personal information in error reports is masked.
						</li>
						<li>
							<strong>Anonymous usage:</strong> If you use the app without an
							account, we store a random identifier to associate your data with
							your browser.
						</li>
					</ul>

					<h3>What We Don't Collect</h3>
					<ul>
						<li>We don't use advertising trackers</li>
						<li>We don't collect location data</li>
						<li>
							We don't access your device contacts or calendar without your
							explicit import action
						</li>
						<li>We don't share your data with third parties for marketing</li>
					</ul>
				</section>

				{/* 3. Legal Basis */}
				<section>
					<h2>3. Legal Basis for Processing</h2>
					<p>We process your data based on:</p>
					<ul>
						<li>
							<strong>Contract performance:</strong> To provide the services you
							signed up for (account management, data storage, synchronization)
						</li>
						<li>
							<strong>Legitimate interests:</strong> To maintain security,
							prevent fraud, and improve our services
						</li>
						<li>
							<strong>Legitimate interests:</strong> Basic error tracking to
							maintain service quality and fix bugs (no personal data is
							collected)
						</li>
					</ul>
				</section>

				{/* 4. Data Sharing */}
				<section>
					<h2>4. Who We Share Data With</h2>
					<p>
						We use a minimal number of third-party services to operate
						AppStandard:
					</p>

					<h3>Service Providers</h3>
					<table>
						<thead>
							<tr>
								<th>Provider</th>
								<th>Purpose</th>
								<th>Data Shared</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Sentry</td>
								<td>Error tracking and performance monitoring</td>
								<td>Error logs, browser info (all text is masked)</td>
							</tr>
							<tr>
								<td>Resend</td>
								<td>Transactional emails</td>
								<td>Email address (for account verification, notifications)</td>
							</tr>
							<tr>
								<td>Database Provider</td>
								<td>Data storage</td>
								<td>All account and content data (encrypted at rest)</td>
							</tr>
						</tbody>
					</table>

					<p>
						We have Data Processing Agreements with these providers. They are
						required to protect your data and can only use it to provide
						services to us.
					</p>

					<h3>We Never Sell Your Data</h3>
					<p>
						We do not sell, rent, or trade your personal information to third
						parties for marketing or advertising purposes.
					</p>
				</section>

				{/* 5. Data Retention */}
				<section>
					<h2>5. How Long We Keep Your Data</h2>
					<ul>
						<li>
							<strong>Account data:</strong> Kept while your account is active.
							Deleted upon account deletion request.
						</li>
						<li>
							<strong>Anonymous data:</strong> Automatically deleted after 60
							days of inactivity.
						</li>
						<li>
							<strong>Error logs:</strong> Retained for up to 90 days for
							debugging purposes.
						</li>
						<li>
							<strong>Backups:</strong> Retained for up to 30 days after
							deletion for disaster recovery.
						</li>
					</ul>
				</section>

				{/* 6. Your Rights */}
				<section>
					<h2>6. Your Rights</h2>
					<p>Under GDPR and other privacy laws, you have the right to:</p>

					<h3>Access Your Data</h3>
					<p>
						Request a copy of all personal data we hold about you. You can
						export your data directly from your account settings.
					</p>

					<h3>Correct Your Data</h3>
					<p>
						Update or correct any inaccurate personal information through your
						account settings.
					</p>

					<h3>Delete Your Data</h3>
					<p>
						Request deletion of your account and all associated data. This can
						be done from your account settings.
					</p>

					<h3>Data Portability</h3>
					<p>
						Export your data in standard formats (iCalendar for calendars, vCard
						for contacts) that can be imported into other applications.
					</p>

					<h3>Object to Processing</h3>
					<p>
						You can object to certain types of processing at any time. Since we
						only use essential cookies and don't perform behavioral tracking,
						most of your data processing is necessary to provide the service.
					</p>

					<h3>Lodge a Complaint</h3>
					<p>
						If you believe we've violated your privacy rights, you can file a
						complaint with your local data protection authority.
					</p>
				</section>

				{/* 7. Security */}
				<section>
					<h2>7. How We Protect Your Data</h2>
					<ul>
						<li>
							<strong>Encryption in transit:</strong> All data transmitted
							between your browser and our servers is encrypted using TLS
						</li>
						<li>
							<strong>Encryption at rest:</strong> Your data is encrypted on our
							servers
						</li>
						<li>
							<strong>Secure authentication:</strong> Passwords are hashed using
							industry-standard algorithms
						</li>
						<li>
							<strong>Privacy-first error tracking:</strong> We only collect
							technical error information. No session replays, no personal data,
							no user behavior tracking.
						</li>
						<li>
							<strong>Open source:</strong> Our security practices can be
							audited by anyone
						</li>
					</ul>
				</section>

				{/* 8. Cookies */}
				<section>
					<h2>8. Cookies and Similar Technologies</h2>

					<h3>Essential Cookies Only</h3>
					<p>
						We only use essential cookies required for the application to
						function. These include session cookies and authentication tokens.
						We do not use advertising, analytics, or tracking cookies.
					</p>

					<h3>Global Privacy Control (GPC)</h3>
					<p>
						We honor the Global Privacy Control signal. If your browser sends a
						GPC signal, we respect it as an expression of your privacy
						preferences.
					</p>
				</section>

				{/* 9. Children */}
				<section>
					<h2>9. Children's Privacy</h2>
					<p>
						AppStandard is not intended for children under 16. We do not
						knowingly collect personal information from children. If you believe
						a child has provided us with personal data, please contact us and we
						will delete it.
					</p>
				</section>

				{/* 10. Changes */}
				<section>
					<h2>10. Changes to This Policy</h2>
					<p>
						We may update this privacy policy from time to time. When we make
						significant changes, we will notify you through the app and update
						the "Last Updated" date. If you have an account, we may also send
						you an email.
					</p>
					<p>
						Continued use of AppStandard after changes constitutes acceptance of
						the updated policy.
					</p>
				</section>

				{/* 11. Contact */}
				<section>
					<h2>11. Contact Us</h2>
					<p>
						If you have questions about this privacy policy or how we handle
						your data, please contact us:
					</p>
					<p className="flex items-center gap-2">
						<Mail className="size-4" aria-hidden="true" />
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
					</p>
					<p>We aim to respond to all privacy inquiries within 30 days.</p>
				</section>
			</article>

			{/* Footer */}
			<footer className="mt-12 border-t pt-8 text-center text-muted-foreground text-sm">
				<p>
					This privacy policy is effective as of {LAST_UPDATED} (v
					{POLICY_VERSION}
					).
				</p>
			</footer>
		</div>
	);
}
