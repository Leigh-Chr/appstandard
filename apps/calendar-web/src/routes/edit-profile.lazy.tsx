import { createLazyFileRoute } from "@tanstack/react-router";
import EditProfile from "@/components/edit-profile";

export const Route = createLazyFileRoute("/edit-profile")({
	component: EditProfile,
});
