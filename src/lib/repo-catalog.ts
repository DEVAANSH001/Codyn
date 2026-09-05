import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";

const REPO_LIMIT = 7600;
const TOPIC_MIN_REPO_COUNT = 20;
const TOPIC_REPO_LIST_LIMIT = 50;
const CATALOG_DATA_FILE = path.join(process.cwd(), "public", "data", "top-repos.json");

export type RepoTier = 'all-time' | 'yearly' | '6-month' | 'monthly' | 'weekly';

export interface CatalogRepoEntry {
  owner: string;
  repo: string;
  stars: number;
  description: string | null;
  topics: string[];
  language: string | null;
  tier?: RepoTier;
  rank?: number;
  trendingScore?: number;
}

interface CatalogData {
  curatedRepos: CatalogRepoEntry[];
  curatedRepoKeys: string[];
  curatedRepoKeySet: Set<string>;
  indexableTopics: string[];
  indexableTopicSet: Set<string>;
  topicBuckets: Map<string, CatalogRepoEntry[]>;
  topicTopRepos: Map<string, CatalogRepoEntry[]>;
}

function isCatalogRepoEntry(value: unknown): value is CatalogRepoEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CatalogRepoEntry>;

  return (
    typeof item.owner === "string" &&
    typeof item.repo === "string" &&
    typeof item.stars === "number" &&
    Array.isArray(item.topics)
  );
}

function normalizeRepo(entry: CatalogRepoEntry): CatalogRepoEntry {
  return {
    owner: entry.owner.trim(),
    repo: entry.repo.trim(),
    stars: entry.stars,
    description: entry.description,
    topics: entry.topics
      .filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0)
      .map((topic) => topic.toLowerCase()),
    language: entry.language,
    tier: entry.tier,
    rank: entry.rank,
    trendingScore: entry.trendingScore,
  };
}

function toRepoKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

function buildCatalogData(repos: CatalogRepoEntry[]): CatalogData {
  const deduped: CatalogRepoEntry[] = [];
  const seenRepoKeys = new Set<string>();

  for (const repo of repos) {
    const normalized = normalizeRepo(repo);
    if (!normalized.owner || !normalized.repo) continue;

    const key = toRepoKey(normalized.owner, normalized.repo);
    if (seenRepoKeys.has(key)) continue;

    seenRepoKeys.add(key);
    deduped.push(normalized);
  }

  const curatedRepos = deduped.slice(0, REPO_LIMIT);
  const curatedRepoKeys = curatedRepos.map((repo) => toRepoKey(repo.owner, repo.repo));
  const curatedRepoKeySet = new Set(curatedRepoKeys);

  const topicBuckets: Record<string, CatalogRepoEntry[]> = {};
  const topicFrequency: Record<string, { allTime: number; trending: number }> = {};

  for (const repo of curatedRepos) {
    const uniqueTopics = new Set(repo.topics);
    const isTrending = repo.tier === 'weekly' || repo.tier === 'monthly' || repo.tier === '6-month';

    for (const topic of uniqueTopics) {
      if (!topicBuckets[topic]) {
        topicBuckets[topic] = [];
        topicFrequency[topic] = { allTime: 0, trending: 0 };
      }
      topicBuckets[topic].push(repo);
      
      if (repo.tier === 'all-time') {
        topicFrequency[topic].allTime++;
      }
      if (isTrending) {
        topicFrequency[topic].trending++;
      }
    }
  }

  // Topic Strategy: 1500 Trending + 500 Stable
  const topicsByCount = Object.entries(topicBuckets)
    .sort((a, b) => b[1].length - a[1].length);

  const eligibleTopics = topicsByCount
    .filter(([, reposForTopic]) => reposForTopic.length >= TOPIC_MIN_REPO_COUNT)
    .map(([topic]) => topic);

  const stableTopics = [...eligibleTopics]
    .sort((a, b) => topicFrequency[b].allTime - topicFrequency[a].allTime)
    .slice(0, 500);

  const remainingTopics = eligibleTopics.filter(t => !stableTopics.includes(t));
  
  const trendingTopics = remainingTopics
    .sort((a, b) => topicFrequency[b].trending - topicFrequency[a].trending)
    .slice(0, 1500);

  const indexableTopics = [...stableTopics, ...trendingTopics].sort();
  const indexableTopicSet = new Set(indexableTopics);

  return {
    curatedRepos,
    curatedRepoKeys,
    indexableTopics,
    curatedRepoKeySet,
    indexableTopicSet,
    topicBuckets: new Map<string, CatalogRepoEntry[]>(Object.entries(topicBuckets)),
    topicTopRepos: new Map<string, CatalogRepoEntry[]>(),
  };
}

const getCatalogDataInternal = async (): Promise<CatalogData> => {
  try {
    const fileContent = await fs.promises.readFile(CATALOG_DATA_FILE, "utf8");
    const parsed = JSON.parse(fileContent) as unknown;
    const repos = Array.isArray(parsed) ? parsed.filter(isCatalogRepoEntry) : [];
    return buildCatalogData(repos);
  } catch (error) {
    console.error("Failed to load repo catalog data:", error);
    return buildCatalogData([]);
  }
};

let inMemoryCatalogData: CatalogData | null = null;

export async function getCatalogData(): Promise<CatalogData> {
  if (inMemoryCatalogData) {
    return inMemoryCatalogData;
  }

  const nextData = await getCatalogDataInternal();
  inMemoryCatalogData = nextData;
  return nextData;
}

/**
 * Manually refresh the repository catalog cache.
 */
export async function refreshCatalogCache() {
  inMemoryCatalogData = null;
  revalidatePath("/topics/[topic]", "page");
  revalidatePath("/repo/[owner]/[repo]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/trending");
}

export async function getCuratedRepos(tier?: RepoTier): Promise<CatalogRepoEntry[]> {
  const data = await getCatalogData();
  if (tier) {
    return data.curatedRepos.filter(repo => repo.tier === tier);
  }
  return data.curatedRepos;
}

export async function isCuratedRepo(owner: string, repo: string): Promise<boolean> {
  const data = await getCatalogData();
  const key = toRepoKey(owner, repo);
  return data.curatedRepoKeySet.has(key);
}

export async function getReposForTopic(topic: string): Promise<CatalogRepoEntry[]> {
  const data = await getCatalogData();
  const normalizedTopic = topic.toLowerCase();
  const cached = data.topicTopRepos.get(normalizedTopic);
  if (cached) {
    return cached;
  }

  const repos = data.topicBuckets.get(normalizedTopic);
  if (!repos || repos.length === 0) {
    data.topicTopRepos.set(normalizedTopic, []);
    return [];
  }

  const topRepos = repos
    .slice()
    .sort((a, b) => b.stars - a.stars)
    .slice(0, TOPIC_REPO_LIST_LIMIT);
  data.topicTopRepos.set(normalizedTopic, topRepos);
  return topRepos;
}

export async function getIndexableTopics(): Promise<string[]> {
  const data = await getCatalogData();
  return data.indexableTopics;
}

export async function isIndexableTopic(topic: string): Promise<boolean> {
  const data = await getCatalogData();
  return data.indexableTopicSet.has(topic.toLowerCase());
}

export async function getCatalogStats() {
  const data = await getCatalogData();
  const tierCounts: Record<string, number> = {
    'all-time': 0,
    'yearly': 0,
    '6-month': 0,
    'monthly': 0,
    'weekly': 0,
  };

  data.curatedRepos.forEach(repo => {
    if (repo.tier) tierCounts[repo.tier]++;
  });

  return {
    totalRepos: data.curatedRepos.length,
    totalTopics: data.indexableTopics.length,
    tierCounts
  };
}
