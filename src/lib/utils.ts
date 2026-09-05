import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalizes an input that might be a GitHub URL, a username, or a username/repo string.
 * @example
 * - "https://github.com/403errors" -> "403errors"
 * - "https://github.com/403errors/echotasks" -> "403errors/echotasks"
 * - "github.com/403errors/echotasks" -> "403errors/echotasks"
 * - "403errors/echotasks" -> "403errors/echotasks"
 * - "403errors" -> "403errors"
 */
export function normalizeGitHubInput(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Simple URL parsing if it looks like one or contains github.com
    try {
        let urlText = trimmed;
        if (!urlText.startsWith('http')) {
            // Check if it's a naked hostname like github.com/owner/repo
            if (urlText.toLowerCase().includes('github.com/')) {
                urlText = 'https://' + urlText;
            } else {
                // If not a URL at all, just return trimmed
                return trimmed;
            }
        }
        
        const url = new URL(urlText);
        if (url.hostname.includes('github.com')) {
            const pathname = url.pathname.replace(/^\/|\/$/g, '');
            const parts = pathname.split('/');
            
            // parts[0] is owner, parts[1] is repo
            if (parts.length >= 2 && parts[0] && parts[1]) {
                return `${parts[0]}/${parts[1]}`;
            } else if (parts.length === 1 && parts[0]) {
                // Special case: ignore known non-user paths like 'trending', 'explore', etc. 
                // but let fetchGitHubData handle the validation.
                return parts[0];
            }
        }
    } catch {
        // Not a URL, proceed to default return
    }

    return trimmed;
}
