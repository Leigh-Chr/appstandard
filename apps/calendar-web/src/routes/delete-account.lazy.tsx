import { createLazyFileRoute } from "@tanstack/react-router";
import DeleteAccount from "@/components/delete-account";

export const Route = createLazyFileRoute("/delete-account")({
	component: DeleteAccount,
});
