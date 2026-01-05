import { Button } from "@appstandard/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Cloud,
	Download,
	FileUp,
	FolderSync,
	Layers,
	Lock,
	Search,
	Smartphone,
	Sparkles,
	Tags,
	UserCheck,
	Zap,
} from "lucide-react";

const BASE_URL = "https://contacts.appstandard.app";
const TITLE = "AppStandard Contacts - Contact management simplified";
const DESCRIPTION =
	"Free, open-source contact manager. Import, edit, organize your vCard files in seconds. No account required, works offline.";

export const Route = createFileRoute("/")({
	component: LandingPage,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			// Open Graph
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: BASE_URL },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:image", content: `${BASE_URL}/og-image.png` },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:locale", content: "en_US" },
			{ property: "og:site_name", content: "AppStandard Contacts" },
			// Twitter Card
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:url", content: BASE_URL },
			{ name: "twitter:title", content: TITLE },
			{ name: "twitter:description", content: DESCRIPTION },
			{ name: "twitter:image", content: `${BASE_URL}/og-image.png` },
		],
		links: [{ rel: "canonical", href: BASE_URL }],
	}),
});

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
					<div className="mx-auto max-w-3xl text-center">
						{/* Badge */}
						<div className="fade-in slide-in-from-bottom-3 mb-8 inline-flex animate-in items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-small duration-500">
							<Sparkles className="size-4 text-primary" aria-hidden="true" />
							<span className="text-foreground/80">
								Free & Open Source • No Account Required • Works Offline
							</span>
						</div>

						{/* Main heading */}
						<h1
							id="hero-heading"
							className="fade-in slide-in-from-bottom-4 mb-6 animate-in text-hero duration-700"
						>
							Contact management,
							<br />
							<span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
								simplified
							</span>
						</h1>

						{/* Subtitle */}
						<p className="fade-in slide-in-from-bottom-5 mx-auto mb-10 max-w-2xl animate-in text-body-large text-muted-foreground duration-1000">
							Import, create, edit, and organize your contacts in just a few
							clicks. Works with{" "}
							<span className="font-medium text-foreground">
								Google Contacts
							</span>
							,{" "}
							<span className="font-medium text-foreground">
								Apple Contacts
							</span>
							, and <span className="font-medium text-foreground">Outlook</span>
							.
						</p>

						{/* CTA buttons */}
						<div className="fade-in slide-in-from-bottom-6 flex animate-in flex-col items-center justify-center gap-4 duration-1000 sm:flex-row">
							<Button size="lg" className="group h-12 gap-2 px-8" asChild>
								<Link to="/contacts">
									Get started for free
									<ArrowRight
										className="size-4 transition-transform group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</Link>
							</Button>
							<Button size="lg" variant="outline" className="h-12" asChild>
								<Link to="/contacts/import">
									<FileUp className="mr-2 size-4" aria-hidden="true" />
									Import contacts
								</Link>
							</Button>
						</div>

						{/* Trust indicators */}
						<div className="fade-in mt-14 flex animate-in flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground text-small duration-1000">
							<div className="flex items-center gap-2.5">
								<Lock className="size-4 text-primary/70" aria-hidden="true" />
								<span>Secure data</span>
							</div>
							<div className="flex items-center gap-2.5">
								<Smartphone
									className="size-4 text-primary/70"
									aria-hidden="true"
								/>
								<span>PWA installable</span>
							</div>
							<div className="flex items-center gap-2.5">
								<Cloud className="size-4 text-primary/70" aria-hidden="true" />
								<span>Cloud synchronization</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section - Bento Grid */}
			<section
				className="section-divider relative overflow-hidden bg-muted/30"
				aria-labelledby="features-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="cross-grid absolute inset-0 opacity-30" />
					<div className="grain-texture absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
				</div>
				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto mb-16 max-w-2xl text-center">
						<h2 id="features-heading" className="mb-8 text-display">
							Simple, powerful features
						</h2>
						<p className="text-muted-foreground">
							Powerful tools to manage your contacts, without complexity.
						</p>
					</div>

					{/* Bento Grid */}
					<div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<BentoCard
							icon={FileUp}
							title="Flexible Import"
							description="Import vCard files from any source. Drag and drop or select."
							delay={0}
						/>
						<BentoCard
							icon={FolderSync}
							title="Smart Sync"
							description="Synchronize contacts across all your devices seamlessly."
							delay={50}
						/>
						<BentoCard
							icon={Download}
							title="Universal Export"
							description="Export to Google Contacts, Apple Contacts, Outlook, and more."
							delay={100}
						/>
						<BentoCard
							icon={Tags}
							title="Group & Organize"
							description="Create groups and tags to organize your contacts efficiently."
							delay={150}
						/>
						<BentoCard
							icon={Search}
							title="Quick Search"
							description="Find contacts by name, email, phone, or any field."
							delay={200}
						/>
						<BentoCard
							icon={Zap}
							title="Offline Mode"
							description="Works offline—access your contacts anywhere, anytime."
							delay={250}
						/>
					</div>
				</div>
			</section>

			{/* How it works Section */}
			<section
				className="section-divider relative"
				aria-labelledby="how-it-works-heading"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="ruled-pattern absolute inset-0 opacity-40" />
					<div className="gradient-mesh grain-texture absolute inset-0 opacity-40" />
				</div>
				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto mb-12 max-w-2xl text-center">
						<h2 id="how-it-works-heading" className="mb-8 text-display">
							How it works
						</h2>
						<p className="text-muted-foreground">
							Three simple steps to master your contacts.
						</p>
					</div>

					<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
						<StepCard
							number="01"
							title="Import or create"
							description="Import existing vCard files or create a new address book."
							delay={0}
						/>
						<StepCard
							number="02"
							title="Edit freely"
							description="Add, modify, or delete contacts. Organize with groups."
							delay={100}
						/>
						<StepCard
							number="03"
							title="Export anywhere"
							description="Download in .vcf format, works with all applications."
							delay={200}
						/>
					</div>
				</div>
			</section>

			{/* Anonymous vs Account Section */}
			<section
				className="section-divider relative overflow-hidden bg-muted/30"
				aria-label="Usage options"
			>
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="cross-grid absolute inset-0 opacity-20" />
					<div className="grain-texture absolute inset-0" />
					<div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
					<div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-chart-2/5 blur-[80px]" />
				</div>
				<div className="container mx-auto px-4 py-20 sm:py-24">
					<div className="mx-auto max-w-4xl">
						<div className="grid gap-6 md:grid-cols-2">
							{/* Anonymous card */}
							<article className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-200 hover:border-muted-foreground/20 hover:shadow-lg">
								<div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-muted">
									<Zap
										className="size-6 text-muted-foreground"
										aria-hidden="true"
									/>
								</div>
								<h3 className="mb-4 text-heading-3">Anonymous Mode</h3>
								<p className="mb-6 text-body text-muted-foreground">
									Use AppStandard Contacts immediately without creating an
									account. Your data stays in your browser.
								</p>
								<ul className="space-y-3 text-body text-muted-foreground">
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>No registration required</span>
									</li>
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>Up to 10 address books</span>
									</li>
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>500 contacts per book</span>
									</li>
								</ul>
							</article>

							{/* Account card - Featured */}
							<article className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card p-8 transition-all duration-200 hover:border-primary/40 hover:shadow-lg">
								<div className="absolute top-6 right-6">
									<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
										Recommended
									</span>
								</div>
								<div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
									<Layers className="size-6" aria-hidden="true" />
								</div>
								<h3 className="mb-4 text-heading-3">With an account</h3>
								<p className="mb-6 text-body text-muted-foreground">
									Create a free account to sync your contacts across all your
									devices.
								</p>
								<ul className="space-y-3 text-body text-muted-foreground">
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>Up to 100 address books</span>
									</li>
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>2,000 contacts per book</span>
									</li>
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>Multi-device synchronization</span>
									</li>
									<li className="flex items-center gap-3">
										<UserCheck
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										<span>Permanent cloud backup</span>
									</li>
								</ul>
							</article>
						</div>
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
						<h2 id="cta-heading" className="mb-8 text-display">
							Ready to simplify your contacts?
						</h2>
						<p className="mb-10 text-muted-foreground">
							Start now, free and without registration.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button size="lg" className="group h-12 gap-2 px-8" asChild>
								<Link to="/contacts/new">
									Create an address book
									<ArrowRight
										className="size-4 transition-transform group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</Link>
							</Button>
							<Button size="lg" variant="outline" className="h-12" asChild>
								<Link to="/login" search={{ mode: "signup" }}>
									Create a free account
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

interface CardProps {
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	title: string;
	description: string;
	delay?: number;
}

function BentoCard({ icon: Icon, title, description, delay = 0 }: CardProps) {
	return (
		<article
			className="group fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden rounded-xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
			style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
		>
			<div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			<div className="relative">
				<div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-muted transition-all duration-200 group-hover:bg-primary/15 group-hover:shadow-lg group-hover:shadow-primary/20">
					<Icon
						className="size-5 text-muted-foreground transition-colors duration-200 group-hover:text-primary"
						aria-hidden
					/>
				</div>
				<h3 className="mb-4 text-heading-3">{title}</h3>
				<p className="text-body text-muted-foreground">{description}</p>
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
				className="step-number mb-4 text-6xl transition-all duration-300 group-hover:scale-105 sm:text-7xl"
				aria-hidden="true"
			>
				{number}
			</div>
			<div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
			<h3 className="mb-4 text-heading-3">{title}</h3>
			<p className="text-body text-muted-foreground">{description}</p>
		</div>
	);
}
