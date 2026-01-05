import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ColorPicker,
	Input,
	Label,
} from "@appstandard/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateAddressBook } from "@/hooks/use-address-books";
import { useServerStatus } from "@/hooks/use-server-status";
import { handleTRPCError } from "@/lib/error-handler";

export const Route = createFileRoute("/contacts/new")({
	component: NewAddressBookPage,
	head: () => ({
		meta: [
			{ title: "Create an address book - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Create a new address book in seconds. Organize your contacts and keep in touch.",
			},
		],
	}),
	errorComponent: ({ error }) => {
		if (import.meta.env.DEV) {
			console.error("Route error:", error);
		}
		return (
			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="border-destructive/50 bg-destructive/5">
					<CardHeader>
						<CardTitle className="text-destructive">Loading error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							{error?.message || "An error occurred"}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	},
});

function NewAddressBookPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [color, setColor] = useState<string | null>("#3b82f6");
	const { createAddressBook, isCreating } = useCreateAddressBook();
	const { isOffline, isChecking } = useServerStatus();

	const handleCreate = () => {
		// Validation
		if (!name.trim()) {
			toast.error("Please enter an address book name");
			return;
		}

		// Check server status
		if (isOffline) {
			toast.error("Backend server unavailable", {
				description:
					"Please start the backend server with 'bun run dev:server'",
				duration: 10000,
			});
			return;
		}

		// Create address book
		createAddressBook(
			{ name: name.trim(), color },
			{
				onSuccess: (addressBook) => {
					toast.success("Address book created! Start adding contacts.");
					navigate({ to: `/contacts/${addressBook.id}` });
				},
				onError: (error) => {
					handleTRPCError(error, {
						fallbackTitle: "Error during creation",
						fallbackDescription:
							"Unable to create the address book. Please try again.",
					});
				},
			},
		);
	};

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
			</div>

			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="card-glow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Create a new address book
						</CardTitle>
						<CardDescription>
							Create an empty address book to start adding contacts
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{isOffline && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
								<AlertCircle className="h-4 w-4" />
								<span>
									The backend server is not accessible. Check that it is
									started.
								</span>
							</div>
						)}
						{isChecking && (
							<div className="flex items-center gap-2 rounded-lg border p-3 text-muted-foreground text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Checking server connection...</span>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="name">Address book name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="My address book"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleCreate();
									}
								}}
								disabled={isCreating}
							/>
						</div>

						<ColorPicker
							value={color}
							onChange={setColor}
							disabled={isCreating}
							label="Address book color"
						/>

						<div className="flex gap-2">
							<Button
								onClick={handleCreate}
								disabled={!name.trim() || isCreating}
								className="interactive-glow flex-1"
							>
								{isCreating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate({ to: "/contacts" })}
								disabled={isCreating}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
