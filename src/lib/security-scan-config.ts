export const SECURITY_SCAN_FILE_LIMITS = {
    quick: 50,
    deep: 300,
} as const;

export const SECURITY_ENGINE_VERSION = "scan-engine-v4";
export const SECURITY_CACHE_KEY_VERSION = "v4";

export const DEFAULT_CONFIDENCE_THRESHOLD = {
    quick: 0.78,
    deep: 0.68,
} as const;
export const SECURITY_AI_CONTEXT_LIMIT = 32000;
