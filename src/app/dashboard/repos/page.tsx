import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { buildInvalidSessionSignOutRedirect, getSessionAuthState } from "@/lib/session-guard";
import MyReposClient from "./MyReposClient";

export default async function MyReposPage() {
    const authState = getSessionAuthState(await auth());
    if (authState === "unauthenticated") redirect("/signin?callbackUrl=%2Fdashboard%2Frepos");
    if (authState === "invalid") redirect(buildInvalidSessionSignOutRedirect());

    return <MyReposClient />;
}
