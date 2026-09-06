import { Redis } from "@upstash/redis";

/** Shared Upstash Redis client. */
export const kv = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "https://invalid.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "missing-token",
});
