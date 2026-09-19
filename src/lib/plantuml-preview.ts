export type PlantUmlNodeKind = "actor" | "component" | "database" | "queue" | "cloud" | "service";

export interface PlantUmlPreviewNode {
    id: string;
    label: string;
    kind: PlantUmlNodeKind;
    group?: string;
}

export interface PlantUmlPreviewEdge {
    from: string;
    to: string;
    label?: string;
    dashed: boolean;
}

export interface PlantUmlPreviewGraph {
    title?: string;
    nodes: PlantUmlPreviewNode[];
    edges: PlantUmlPreviewEdge[];
}

const NODE_PATTERN = /^\s*(actor|component|database|queue|cloud|node|rectangle|storage|folder)\s+(?:"([^"]+)"|([^\s{]+))(?:\s+as\s+([\w.-]+))?/i;
const BRACKET_NODE_PATTERN = /^\s*\[([^\]]+)]\s+as\s+([\w.-]+)/i;
const EDGE_PATTERN = /^\s*([\w.-]+)\s*(-->|->|\.\.>|--|<--|<-)\s*([\w.-]+)(?:\s*:\s*(.+))?\s*$/;
const GROUP_PATTERN = /^\s*(?:package|frame|node|rectangle|cloud)\s+"([^"]+)"\s*\{\s*$/i;

function normalizeKind(value: string): PlantUmlNodeKind {
    const kind = value.toLowerCase();
    if (kind === "actor" || kind === "database" || kind === "queue" || kind === "cloud") return kind;
    if (kind === "component") return "component";
    return "service";
}

export function parsePlantUmlPreview(source: string): PlantUmlPreviewGraph {
    const nodes = new Map<string, PlantUmlPreviewNode>();
    const edges: PlantUmlPreviewEdge[] = [];
    const groups: string[] = [];
    let title: string | undefined;

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("'") || line.startsWith("@") || /^skinparam\b/i.test(line) || /^!theme\b/i.test(line)) continue;
        const titleMatch = line.match(/^title\s+(.+)$/i);
        if (titleMatch) {
            title = titleMatch[1].trim();
            continue;
        }
        const groupMatch = rawLine.match(GROUP_PATTERN);
        if (groupMatch) {
            groups.push(groupMatch[1]);
            continue;
        }
        if (line === "}") {
            groups.pop();
            continue;
        }
        const bracketNode = rawLine.match(BRACKET_NODE_PATTERN);
        if (bracketNode) {
            nodes.set(bracketNode[2], { id: bracketNode[2], label: bracketNode[1], kind: "component", group: groups.at(-1) });
            continue;
        }
        const nodeMatch = rawLine.match(NODE_PATTERN);
        if (nodeMatch && !rawLine.match(GROUP_PATTERN)) {
            const label = nodeMatch[2] || nodeMatch[3];
            const id = nodeMatch[4] || label.replace(/[^a-zA-Z0-9_.-]+/g, "_");
            nodes.set(id, { id, label, kind: normalizeKind(nodeMatch[1]), group: groups.at(-1) });
            continue;
        }
        const edgeMatch = rawLine.match(EDGE_PATTERN);
        if (edgeMatch) {
            let from = edgeMatch[1];
            let to = edgeMatch[3];
            if (edgeMatch[2].startsWith("<")) [from, to] = [to, from];
            for (const id of [from, to]) {
                if (!nodes.has(id)) nodes.set(id, { id, label: id.replace(/_/g, " "), kind: "service", group: groups.at(-1) });
            }
            edges.push({ from, to, label: edgeMatch[4]?.trim(), dashed: edgeMatch[2].includes("..") });
        }
    }

    return { title, nodes: [...nodes.values()], edges };
}

export function layoutPlantUmlGraph(graph: PlantUmlPreviewGraph) {
    const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
    const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as string[]]));
    for (const edge of graph.edges) {
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
        outgoing.get(edge.from)?.push(edge.to);
    }
    const levels = new Map<string, number>();
    const queue = graph.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
    if (!queue.length && graph.nodes[0]) queue.push(graph.nodes[0].id);
    for (const id of queue) levels.set(id, 0);
    while (queue.length) {
        const id = queue.shift()!;
        const level = levels.get(id) ?? 0;
        for (const target of outgoing.get(id) ?? []) {
            levels.set(target, Math.max(levels.get(target) ?? 0, level + 1));
            indegree.set(target, (indegree.get(target) ?? 1) - 1);
            if (indegree.get(target) === 0) queue.push(target);
        }
    }
    for (const node of graph.nodes) if (!levels.has(node.id)) levels.set(node.id, 1);

    const columns = new Map<number, PlantUmlPreviewNode[]>();
    for (const node of graph.nodes) {
        const level = Math.min(levels.get(node.id) ?? 0, 5);
        columns.set(level, [...(columns.get(level) ?? []), node]);
    }
    const positions = new Map<string, { x: number; y: number }>();
    let maxRows = 1;
    for (const [level, nodes] of [...columns.entries()].sort(([a], [b]) => a - b)) {
        maxRows = Math.max(maxRows, nodes.length);
        nodes.forEach((node, index) => positions.set(node.id, { x: 45 + level * 245, y: 70 + index * 125 }));
    }
    const maxLevel = Math.max(0, ...columns.keys());
    return { positions, width: Math.max(720, 90 + (maxLevel + 1) * 245), height: Math.max(300, 105 + maxRows * 125) };
}
