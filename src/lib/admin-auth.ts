import type { Session } from "next-auth";

export const DEFAULT_ADMIN_GITHUB_USERNAME = "DEVAANSH001";

export function isAdminUser(session: Session | null | undefined): boolean {
    const configuredAdmin = (
        process.env.ADMIN_GITHUB_USERNAME || DEFAULT_ADMIN_GITHUB_USERNAME
    ).trim().toLowerCase();
    const sessionUsername = session?.user?.username?.trim().toLowerCase();

    return Boolean(sessionUsername && sessionUsername === configuredAdmin);
}
