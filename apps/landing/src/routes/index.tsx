import { Button } from "@appstandard/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle2,
	Cloud,
	Download,
	Github,
	Globe,
	Heart,
	Lock,
	Smartphone,
	Sparkles,
	Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

// Environment-aware URLs - use subdomains in production
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

const products = [
	{
		name: "AppStandard Calendar",
		description:
			"Import, create, edit, and merge your ICS calendars. Works with Google Calendar, Apple Calendar, and Outlook.",
		logoSrc: "/calendar-icon.png",
		bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
		borderColor: "border-amber-500/20 hover:border-amber-500/50",
		shadowColor: "hover:shadow-amber-500/10",
		url: CALENDAR_URL,
		features: [
			"Import & Export .ics files",
			"Merge multiple calendars",
			"Month & list views",
			"Works offline",
		],
		status: "Available" as const,
	},
	{
		name: "AppStandard Tasks",
		description:
			"Organize your tasks with lists, priorities, and labels. Stay productive with a clean, focused interface.",
		logoSrc: "/tasks-icon.png",
		bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
		borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
		shadowColor: "hover:shadow-indigo-500/10",
		url: TASKS_URL,
		features: [
			"Organize with lists",
			"Priority & labels",
			"Due dates & reminders",
			"Cloud sync",
		],
		status: "Available" as const,
	},
	{
		name: "AppStandard Contacts",
		description:
			"Manage your contacts with vCard support. Import, organize, and export your address book effortlessly.",
		logoSrc: "/contacts-icon.png",
		bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
		borderColor: "border-teal-500/20 hover:border-teal-500/50",
		shadowColor: "hover:shadow-teal-500/10",
		url: CONTACTS_URL,
		features: [
			"vCard import/export",
			"Smart organization",
			"Group management",
			"Multi-device sync",
		],
		status: "Available" as const,
	},
];

const features = [
	{
		icon: Lock,
		title: "Privacy First",
		description:
			"Your data stays yours. No tracking, no ads, no selling your information.",
	},
	{
		icon: Globe,
		title: "Open Source",
		description:
			"Fully transparent codebase. Audit, contribute, or self-host on your own server.",
	},
	{
		icon: Zap,
		title: "No Account Required",
		description:
			"Start using immediately. Create an account only when you want cloud sync.",
	},
	{
		icon: Smartphone,
		title: "Works Offline",
		description:
			"Progressive Web Apps that work without internet. Install on any device.",
	},
	{
		icon: Cloud,
		title: "Cloud Sync",
		description:
			"Optional synchronization across all your devices with a free account.",
	},
	{
		icon: Download,
		title: "Standard Formats",
		description:
			"Uses iCalendar (.ics) and vCard (.vcf) standards. No vendor lock-in ever.",
	},
];

function LandingPage() {
	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<section
				className="relative isolate overflow-hidden"
				aria-labelledby="hero-heading"
			>
				{/* Background effects */}
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="aurora absolute inset-0" />
					<div className="dot-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
					<div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
					<div className="absolute top-20 left-[20%] h-[300px] w-[300px] rounded-full bg-chart-3/10 blur-[80px]" />
					<div className="noise-overlay absolute inset-0" />
				</div>

				<div className="container mx-auto px-4 py-16 sm:py-24 md:py-32">
					<div className="mx-auto max-w-4xl text-center">
						{/* Badge */}
						<div className="fade-in slide-in-from-bottom-3 mb-8 inline-flex animate-in items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-small duration-500">
							<Sparkles className="size-4 text-primary" aria-hidden="true" />
							<span className="text-foreground/80">
								Free & Open Source • Privacy First • Works Offline
							</span>
						</div>

						{/* Main heading */}
						<h1
							id="hero-heading"
							className="fade-in slide-in-from-bottom-4 mb-6 animate-in text-hero duration-700"
						>
							Your productivity,
							<br />
							<span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
								your way
							</span>
						</h1>

						{/* Subtitle */}
						<p className="fade-in slide-in-from-bottom-5 mx-auto mb-10 max-w-2xl animate-in text-body-large text-muted-foreground duration-1000">
							Open-source apps for{" "}
							<span className="font-medium text-foreground">calendars</span>,{" "}
							<span className="font-medium text-foreground">contacts</span>, and{" "}
							<span className="font-medium text-foreground">tasks</span>. No
							subscriptions, no tracking, no compromises.
						</p>

						{/* CTA buttons */}
						<div className="fade-in slide-in-from-bottom-6 flex animate-in flex-col items-center justify-center gap-4 duration-1000 sm:flex-row">
							<Button size="lg" className="group h-12 gap-2 px-8" asChild>
								<a href={CALENDAR_URL}>
									Try AppStandard Calendar
									<ArrowRight
										className="size-4 transition-transform group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-12 gap-2"
								asChild
							>
								<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
									<Github className="size-4" aria-hidden="true" />
									View on GitHub
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</Button>
						</div>

						{/* Trust indicators */}
						<div className="fade-in mt-14 flex animate-in flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground text-small duration-1000">
							<div className="flex items-center gap-2.5">
								<Lock className="size-4 text-primary/70" aria-hidden="true" />
								<span>Privacy focused</span>
							</div>
							<div className="flex items-center gap-2.5">
								<Smartphone
									className="size-4 text-primary/70"
									aria-hidden="true"
								/>
								<span>PWA installable</span>
							</div>
							<div className="flex items-center gap-2.5">
								<Globe className="size-4 text-primary/70" aria-hidden="true" />
								<span>100% Open Source</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Products Section */}
			<section
				className="section-divider relative overflow-hidden bg-muted/30"
				aria-labelledby="products-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="cross-grid absolute inset-0 opacity-30" />
					<div className="grain-texture absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
				</div>

				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto mb-16 max-w-2xl text-center">
						<h2 id="products-heading" className="mb-6 text-display">
							The AppStandard Suite
						</h2>
						<p className="text-body-large text-muted-foreground">
							Three essential apps designed to work together and respect your
							privacy.
						</p>
					</div>

					<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
						{products.map((product, index) => (
							<ProductCard
								key={product.name}
								product={product}
								delay={index * 100}
							/>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				className="section-divider relative"
				aria-labelledby="features-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh grain-texture absolute inset-0 opacity-40" />
				</div>

				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto mb-16 max-w-2xl text-center">
						<h2 id="features-heading" className="mb-6 text-display">
							Why AppStandard?
						</h2>
						<p className="text-body-large text-muted-foreground">
							Built with the values that matter: privacy, simplicity, and
							freedom.
						</p>
					</div>

					<div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<FeatureCard
								key={feature.title}
								feature={feature}
								delay={index * 50}
							/>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section
				className="section-divider relative overflow-hidden bg-muted/30"
				aria-labelledby="how-it-works-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="cross-grid absolute inset-0 opacity-20" />
					<div className="grain-texture absolute inset-0" />
				</div>

				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto mb-12 max-w-2xl text-center">
						<h2 id="how-it-works-heading" className="mb-6 text-display">
							How it works
						</h2>
						<p className="text-body-large text-muted-foreground">
							Three simple steps to get started.
						</p>
					</div>

					<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
						<StepCard
							number="01"
							title="Choose an app"
							description="Pick from Calendar, Tasks, or Contacts based on your needs."
							delay={0}
						/>
						<StepCard
							number="02"
							title="Start using it"
							description="No account needed. Import your data or start fresh instantly."
							delay={100}
						/>
						<StepCard
							number="03"
							title="Sync optionally"
							description="Create a free account only if you want cloud synchronization."
							delay={200}
						/>
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section
				className="section-divider relative overflow-hidden"
				aria-labelledby="cta-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="aurora absolute inset-0 opacity-70" />
					<div className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
					<div className="dot-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]" />
				</div>

				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto max-w-2xl text-center">
						<h2 id="cta-heading" className="mb-6 text-display">
							Ready to take control?
						</h2>
						<p className="mb-10 text-body-large text-muted-foreground">
							Start using AppStandard today. Free, open source, and respects
							your privacy.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button size="lg" className="group h-12 gap-2 px-8" asChild>
								<a href={CALENDAR_URL}>
									Get started with Calendar
									<ArrowRight
										className="size-4 transition-transform group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-12 gap-2"
								asChild
							>
								<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
									<Heart className="size-4" aria-hidden="true" />
									Star on GitHub
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

interface Product {
	name: string;
	description: string;
	logoSrc: string;
	bgColor: string;
	borderColor: string;
	shadowColor: string;
	url: string;
	features: string[];
	status: "Available" | "Coming Soon";
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
	const isAvailable = product.status === "Available";

	return (
		<article
			className={`group fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden rounded-2xl border-2 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${product.borderColor} ${product.shadowColor}`}
			style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
		>
			{/* Gradient overlay on hover */}
			<div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

			{/* Status badge */}
			<div className="absolute top-6 right-6">
				<span
					className={`rounded-full px-3 py-1 font-medium text-xs ${
						isAvailable
							? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
							: "bg-muted text-muted-foreground"
					}`}
				>
					{product.status}
				</span>
			</div>

			{/* Logo */}
			<div
				className={`relative mb-6 inline-flex size-16 items-center justify-center rounded-xl ${product.bgColor} transition-transform duration-300 group-hover:scale-110`}
			>
				<img
					src={product.logoSrc}
					alt=""
					className="size-12"
					aria-hidden="true"
				/>
			</div>

			<h3 className="relative mb-3 text-heading-3">{product.name}</h3>
			<p className="relative mb-6 text-body text-muted-foreground">
				{product.description}
			</p>

			{/* Features list */}
			<ul className="relative mb-8 space-y-2.5">
				{product.features.map((feature) => (
					<li
						key={feature}
						className="flex items-center gap-2.5 text-muted-foreground text-small"
					>
						<CheckCircle2
							className="size-4 shrink-0 text-primary"
							aria-hidden="true"
						/>
						<span>{feature}</span>
					</li>
				))}
			</ul>

			{/* CTA */}
			{isAvailable ? (
				<Button className="group/btn relative w-full gap-2" asChild>
					<a href={product.url}>
						Open {product.name.split(" ").pop()}
						<ArrowRight
							className="size-4 transition-transform group-hover/btn:translate-x-1"
							aria-hidden="true"
						/>
					</a>
				</Button>
			) : (
				<Button
					variant="outline"
					className="relative w-full cursor-not-allowed opacity-60"
					disabled
				>
					Coming Soon
				</Button>
			)}
		</article>
	);
}

interface Feature {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
}

function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
	const Icon = feature.icon;

	return (
		<article
			className="group fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden rounded-xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
			style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
		>
			<div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			<div className="relative">
				<div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-muted transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/15 group-hover:shadow-lg group-hover:shadow-primary/20">
					<Icon
						className="size-5 text-muted-foreground transition-colors duration-200 group-hover:text-primary"
						aria-hidden="true"
					/>
				</div>
				<h3 className="mb-3 text-heading-3">{feature.title}</h3>
				<p className="text-body text-muted-foreground">{feature.description}</p>
			</div>
		</article>
	);
}

function StepCard({
	number,
	title,
	description,
	delay = 0,
}: {
	number: string;
	title: string;
	description: string;
	delay?: number;
}) {
	return (
		<div
			className="group fade-in slide-in-from-bottom-4 relative animate-in text-center"
			style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
		>
			<div
				className="step-number mb-4 text-6xl transition-all duration-300 group-hover:scale-110 sm:text-7xl"
				aria-hidden="true"
			>
				{number}
			</div>
			<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-all duration-300 group-hover:w-24 group-hover:via-primary/50" />
			<h3 className="mb-3 text-heading-3">{title}</h3>
			<p className="text-body text-muted-foreground">{description}</p>
		</div>
	);
}
