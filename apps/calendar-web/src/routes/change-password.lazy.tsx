import { createLazyFileRoute } from "@tanstack/react-router";
import ChangePassword from "@/components/change-password";

export const Route = createLazyFileRoute("/change-password")({
	component: ChangePassword,
});
