export type TestMapping = { sourcePath: string; relatedTests: string[]; confidence: "high" | "medium" | "none" };

function withoutExtension(path: string): string {
    return path.replace(/\.[^.]+$/, "");
}

export function mapSourceToTests(sourcePath: string, paths: string[]): TestMapping {
    const sourceStem = withoutExtension(sourcePath).toLowerCase();
    const filenameStem = sourceStem.split("/").pop() ?? sourceStem;
    const candidates = paths.filter((path) => /(?:\.test|\.spec)\.[cm]?[jt]sx?$|(?:^|\/)(?:test|tests|__tests__)\//i.test(path));
    const exact = candidates.filter((path) => withoutExtension(path).replace(/\.(test|spec)$/i, "").toLowerCase() === sourceStem);
    if (exact.length) return { sourcePath, relatedTests: exact.sort(), confidence: "high" };
    const related = candidates.filter((path) => withoutExtension(path).toLowerCase().includes(filenameStem));
    return { sourcePath, relatedTests: related.sort(), confidence: related.length ? "medium" : "none" };
}
