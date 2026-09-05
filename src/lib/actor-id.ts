import { createHash } from "node:crypto";

export const ANON_COOKIE_NAME = "rm_anon_id";
const ANON_COOKIE_ID_PATTERN = /^[a-f0-9]{24}$/;

function firstHeaderValue(raw: string | null): string {
    if (!raw) return "unknown";
    const first = raw.split(",")[0]?.trim();
    return first && first.length > 0 ? first : "unknown";
}

export function isValidAnonymousCookieId(value: string | null | undefined): value is string {
    return typeof value === "string" && ANON_COOKIE_ID_PATTERN.test(value.trim().toLowerCase());
}

export function getAnonymousCookieIdFromActorId(actorId: string): string | null {
    if (!actorId.startsWith("anon_")) return null;
    const raw = actorId.slice("anon_".length).trim().toLowerCase();
    return ANON_COOKIE_ID_PATTERN.test(raw) ? raw : null;
}

export function getAnonymousActorId(headers: Headers, anonymousCookieId?: string | null): string {
    if (isValidAnonymousCookieId(anonymousCookieId)) {
        return `anon_${anonymousCookieId.trim().toLowerCase()}`;
    }

    const ip = firstHeaderValue(
        headers.get("x-forwarded-for") ??
        headers.get("x-real-ip") ??
        headers.get("cf-connecting-ip")
    );
    const userAgent = headers.get("user-agent") ?? "unknown";
    const payload = `${ip}|${userAgent}`;
    const hash = createHash("sha256").update(payload).digest("hex").slice(0, 24);
    return `anon_${hash}`;
}
