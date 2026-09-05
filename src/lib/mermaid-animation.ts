const ROUTE_BEAD_DIAGRAM_TYPES = new Set(["flowchart", "sequenceDiagram", "stateDiagram-v2"]);
const DEDICATED_PREVIEW_ANIMATION_EXCLUDED_TYPES = new Set(["mindmap", "xychart"]);

export function getMermaidDiagramDeclaration(source: string): string | null {
    const lines = (source || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("%%"));

    if (lines.length === 0) {
        return null;
    }

    const firstLine = lines[0];
    const token = firstLine.split(/\s+/)[0];
    return token || null;
}

export function supportsRouteBeadAnimation(source: string): boolean {
    const declaration = getMermaidDiagramDeclaration(source);
    if (!declaration) return false;
    return ROUTE_BEAD_DIAGRAM_TYPES.has(declaration);
}

export function capBeadCount(requested: number, max = 2): number {
    if (!Number.isFinite(requested) || requested <= 0) return 0;
    if (!Number.isFinite(max) || max <= 0) return 0;
    return Math.min(Math.floor(requested), Math.floor(max));
}

export function resolveRouteBeadCount(source: string, routeCount: number, max = 2): number {
    if (!supportsRouteBeadAnimation(source)) {
        return 0;
    }
    return capBeadCount(routeCount, max);
}

export function shouldEnableLoopingBeads(prefersReducedMotion: boolean): boolean {
    return !prefersReducedMotion;
}

export function shouldAnimateDedicatedPreview(source: string, prefersReducedMotion: boolean): boolean {
    if (prefersReducedMotion) {
        return false;
    }
    const declaration = getMermaidDiagramDeclaration(source);
    if (!declaration) {
        return true;
    }
    return !DEDICATED_PREVIEW_ANIMATION_EXCLUDED_TYPES.has(declaration);
}
