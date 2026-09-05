import { describe, it, expect, vi } from 'vitest';
import { getCuratedRepos } from '../repo-catalog';
import fs from 'node:fs';

// Mock fs to return mock catalog data
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn(),
        statSync: vi.fn(() => ({ mtime: new Date() })),
        existsSync: vi.fn(() => true),
        promises: {
            readFile: vi.fn(),
        },
    },
    readFileSync: vi.fn(),
    statSync: vi.fn(() => ({ mtime: new Date() })),
    existsSync: vi.fn(() => true),
    promises: {
        readFile: vi.fn(),
    },
}));

// Mock next/cache since unstable_cache won't work in Vitest
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
}));

describe('repo-catalog', () => {
    it('should filter repos by tier', async () => {
        const mockRepos = [
            { owner: 'owner1', repo: 'repo1', stars: 100, tier: 'weekly', topics: ['topic1'], language: 'TypeScript' },
            { owner: 'owner2', repo: 'repo2', stars: 200, tier: 'monthly', topics: ['topic2'], language: 'JavaScript' },
            { owner: 'owner3', repo: 'repo3', stars: 300, tier: 'all-time', topics: ['topic1', 'topic3'], language: 'Go' },
        ];
        
        // Mock both versions in case of internal implementation details
        vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockRepos));

        const weekly = await getCuratedRepos('weekly');
        expect(weekly).toHaveLength(1);
        expect(weekly[0].repo).toBe('repo1');

        const allTime = await getCuratedRepos('all-time');
        expect(allTime).toHaveLength(1);
        expect(allTime[0].repo).toBe('repo3');
    });

    it('should return all curated repos if no tier is specified', async () => {
        const all = await getCuratedRepos();
        expect(all).toHaveLength(3);
    });
});
