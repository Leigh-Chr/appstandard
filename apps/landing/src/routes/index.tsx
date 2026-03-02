import { Button } from "@appstandard/ui";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Github, Globe, Lock, Smartphone } from "lucide-react";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const isDev = import.meta.env["DEV"];
const CALENDAR_URL = isDev
	? "http://localhost:3001"
	: "https://calendar.appstandard.io";
const TASKS_URL = isDev
	? "http://localhost:3004"
	: "https://tasks.appstandard.io";
const CONTACTS_URL = isDev
	? "http://localhost:3005"
	: "https://contacts.appstandard.io";
const GITHUB_URL = "https://github.com/Leigh-Chr/appstandard";

function LandingPage() {
	return (
		<div className="flex flex-col">
			<HeroSection />
			<ProductsSection />
			<PrinciplesSection />
			<CtaSection />
		</div>
	);
}

function HeroSection() {
	return (
		<section
			className="py-16 content-column sm:py-24"
			aria-labelledby="hero-heading"
		>
			<div className="max-w-xl">
				<h1 id="hero-heading" className="mb-4 text-display">
					Your productivity, your rules.
				</h1>
				<p className="mb-8 text-body-large text-muted-foreground">
					Open-source apps for calendars, contacts, and tasks. No subscriptions,
					no tracking, no compromises.
				</p>
				<div className="flex flex-wrap gap-3">
					<Button size="lg" asChild>
						<a href={CALENDAR_URL}>Try Calendar</a>
					</Button>
					<Button size="lg" variant="outline" className="gap-2" asChild>
						<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
							<Github className="size-4" aria-hidden="true" />
							Source code
							<span className="sr-only">(opens in new tab)</span>
						</a>
					</Button>
				</div>
			</div>
		</section>
	);
}

function ProductsSection() {
	return (
		<section className="border-t" aria-labelledby="products-heading">
			<div className="py-16 content-column sm:py-24">
				<h2 id="products-heading" className="sr-only">
					Products
				</h2>
				<div className="flex flex-col gap-16 sm:gap-20">
					<ProductSection
						name="Calendar"
						description="Import, create, edit, and merge your ICS calendars. Works with Google Calendar, Apple Calendar, and Outlook."
						iconSrc="/calendar-icon.png"
						url={CALENDAR_URL}
						dotColor="bg-amber-500"
						features={[
							"Import & export .ics files",
							"Merge multiple calendars",
							"Month & list views",
							"Works offline",
						]}
					/>
					<ProductSection
						name="Tasks"
						description="Organize your tasks with lists, priorities, and labels. Track progress and plan your day."
						iconSrc="/tasks-icon.png"
						url={TASKS_URL}
						dotColor="bg-indigo-500"
						features={[
							"Organize with lists",
							"Priority & labels",
							"Due dates & reminders",
							"Cloud sync",
						]}
					/>
					<ProductSection
						name="Contacts"
						description="Manage your contacts with vCard support. Import, organize, and export your address book."
						iconSrc="/contacts-icon.png"
						url={CONTACTS_URL}
						dotColor="bg-teal-500"
						features={[
							"vCard import/export",
							"Sort & group contacts",
							"Group management",
							"Multi-device sync",
						]}
					/>
				</div>
			</div>
		</section>
	);
}

function ProductSection({
	name,
	description,
	iconSrc,
	url,
	dotColor,
	features,
}: {
	name: string;
	description: string;
	iconSrc: string;
	url: string;
	dotColor: string;
	features: string[];
}) {
	return (
		<article className="grid gap-6 sm:grid-cols-2 sm:gap-12">
			<div>
				<div className="mb-3 flex items-center gap-3">
					<img src={iconSrc} alt="" className="size-10" aria-hidden="true" />
					<h3 className="mb-0 text-heading-3">{name}</h3>
				</div>
				<p className="mb-4 text-muted-foreground">{description}</p>
				<Button variant="outline" size="sm" asChild>
					<a href={url}>Open {name}</a>
				</Button>
			</div>
			<ul className="space-y-2.5 sm:pt-1">
				{features.map((feature) => (
					<li
						key={feature}
						className="flex items-center gap-2.5 text-muted-foreground text-sm"
					>
						<span
							className={`size-1.5 shrink-0 rounded-full ${dotColor}`}
							aria-hidden="true"
						/>
						{feature}
					</li>
				))}
			</ul>
		</article>
	);
}

const principles = [
	{
		icon: Lock,
		title: "Privacy first",
		description:
			"Your data stays yours. No tracking, no ads, no selling your information.",
	},
	{
		icon: Globe,
		title: "Open source",
		description: "Fully transparent codebase. Audit, contribute, or self-host.",
	},
	{
		icon: Smartphone,
		title: "Works offline",
		description:
			"Progressive Web Apps that work without internet. Install on any device.",
	},
	{
		icon: FileText,
		title: "Standard formats",
		description: "Uses iCalendar (.ics) and vCard (.vcf). No vendor lock-in.",
	},
];

function PrinciplesSection() {
	return (
		<section className="border-t" aria-labelledby="principles-heading">
			<div className="py-16 content-column sm:py-24">
				<h2 id="principles-heading" className="mb-10 text-heading-2">
					Why AppStandard
				</h2>
				<div className="grid gap-8 sm:grid-cols-2">
					{principles.map((item) => {
						const Icon = item.icon;
						return (
							<div key={item.title}>
								<div className="mb-1.5 flex items-center gap-2">
									<Icon
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
									<p className="font-medium text-sm">{item.title}</p>
								</div>
								<p className="text-muted-foreground text-sm">
									{item.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function CtaSection() {
	return (
		<section className="border-t" aria-labelledby="cta-heading">
			<div className="py-16 content-column sm:py-24">
				<h2 id="cta-heading" className="mb-2 text-heading-2">
					Get started
				</h2>
				<p className="mb-6 text-muted-foreground">
					Pick an app and start using it.
				</p>
				<div className="flex flex-wrap gap-3">
					<Button asChild>
						<a href={CALENDAR_URL}>Calendar</a>
					</Button>
					<Button variant="outline" asChild>
						<a href={TASKS_URL}>Tasks</a>
					</Button>
					<Button variant="outline" asChild>
						<a href={CONTACTS_URL}>Contacts</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
