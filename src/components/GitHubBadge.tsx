"use client";

import { useEffect, useState } from "react";

import { Github, Star } from "lucide-react";
import { fetchRepoDetails } from "@/app/actions";

interface RepoWithStars {
    stargazers_count: number;
}

function isRepoWithStars(data: unknown): data is RepoWithStars {
    return Boolean(
        data &&
        typeof data === "object" &&
        "stargazers_count" in data &&
        typeof (data as { stargazers_count?: unknown }).stargazers_count === "number"
    );
}

export function GitHubBadge() {
    const [stars, setStars] = useState<number | null>(null);

    useEffect(() => {
        const getStars = async () => {
            try {
                const data = await fetchRepoDetails("DEVAANSH001", "Codyn");
                if (isRepoWithStars(data)) {
                    setStars(data.stargazers_count);
                }
            } catch (e) {
                console.error("Failed to fetch repo stars", e);
            }
        };
        getStars();
    }, []);

    return (
        <a
            href="https://github.com/DEVAANSH001/Codyn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform cursor-pointer block"
        >
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-600/30 rounded-full backdrop-blur-md hover:border-cyan-600/50 transition-colors text-white shadow-lg">
                <Github className="w-5 h-5 md:w-4 md:h-4 text-cyan-400" />
                <span className="hidden md:inline text-sm font-medium text-cyan-200">Star on GitHub</span>
                {stars !== null ? (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-cyan-600/30 ml-1 text-zinc-400">
                        <span className="text-xs font-mono text-cyan-300">{stars.toLocaleString()}</span>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-cyan-600/30 ml-1 animate-pulse">
                        <div className="w-8 h-3 bg-cyan-900/40 rounded mx-1" />
                        <Star className="w-3 h-3 text-cyan-700 fill-cyan-700" />
                    </div>
                )}
            </div>
        </a>
    );
}
