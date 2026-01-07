import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Progress,
} from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ExportDataButton } from "@/components/export-data-button";
import { trpcClient } from "@/utils/trpc";

export const Route = createLazyFileRoute("/account")({
	component: AccountPage,
});

interface UsageInfo {
	taskListCount: number;
	maxTaskLists: number;
	maxTasksPerList: number;
}

function UsageCard({ usage }: { usage: UsageInfo | null | undefined }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Usage</CardTitle>
				<CardDescription>Your usage statistics</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{usage ? (
					<UsageDetails usage={usage} />
				) : (
					<p className="text-muted-foreground text-sm">Loading...</p>
				)}
			</CardContent>
		</Card>
	);
}

function UsageDetails({ usage }: { usage: UsageInfo }) {
	const taskListPercentage = Math.round(
		(usage.taskListCount / usage.maxTaskLists) * 100,
	);

	return (
		<>
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Task lists</span>
					<span className="font-medium">
						{usage.taskListCount} / {usage.maxTaskLists}
					</span>
				</div>
				<Progress value={taskListPercentage} className="h-2" />
			</div>
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Tasks per list</span>
					<span className="font-medium">
						Max {usage.maxTasksPerList.toLocaleString("en-US")}
					</span>
				</div>
			</div>
		</>
	);
}

function ProfileCard({
	userName,
	userEmail,
}: {
	userName?: string;
	userEmail?: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>Your account information</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-sm">
					<strong>Name:</strong> {userName}
				</p>
				<p className="text-sm">
					<strong>Email:</strong> {userEmail}
				</p>
			</CardContent>
			<CardFooter className="flex flex-col gap-2">
				<Button variant="outline" className="w-full" asChild>
					<Link to="/edit-profile">Edit profile</Link>
				</Button>
				<Button variant="outline" className="w-full" asChild>
					<Link to="/change-password">Change password</Link>
				</Button>
				<ExportDataButton />
			</CardFooter>
		</Card>
	);
}

function DangerZoneCard() {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">Danger Zone</CardTitle>
				<CardDescription>Irreversible and destructive actions</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground text-sm">
					Once you delete your account, there is no going back. Please be
					certain.
				</p>
			</CardContent>
			<CardFooter>
				<Button variant="destructive" className="w-full" asChild>
					<Link to="/delete-account">Delete account</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

function AccountPage() {
	const { session } = Route.useRouteContext();
	const usageQuery = useQuery({
		queryKey: ["user", "usage"],
		queryFn: () => trpcClient.user.getUsage.query(),
	});

	const usage = usageQuery.data?.usage;

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-40" />
			</div>

			<div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
				<div className="mb-8">
					<h1 className="mb-2 font-bold text-3xl">My account</h1>
					<p className="text-muted-foreground">
						Hello {session.data?.user.name?.split(" ")[0] || "there"}
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<UsageCard usage={usage} />
					<ProfileCard
						userName={session.data?.user.name}
						userEmail={session.data?.user.email}
					/>
				</div>

				<div className="mt-8">
					<DangerZoneCard />
				</div>
			</div>
		</div>
	);
}
