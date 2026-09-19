import { NextRequest, NextResponse } from "next/server";

const MAX_SOURCE_LENGTH = 50_000;
const FORBIDDEN_DIRECTIVE = /^\s*!(?:include|includeurl|import|pragma|define|function|procedure)\b/im;

export async function POST(request: NextRequest) {
    let body: { source?: unknown };
    try {
        body = await request.json() as { source?: unknown };
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const source = typeof body.source === "string" ? body.source.trim() : "";
    if (!source || source.length > MAX_SOURCE_LENGTH) {
        return NextResponse.json({ error: "PlantUML source must be between 1 and 50,000 characters." }, { status: 400 });
    }
    if (!source.startsWith("@startuml") || !source.endsWith("@enduml")) {
        return NextResponse.json({ error: "PlantUML source must start with @startuml and end with @enduml." }, { status: 400 });
    }
    if (FORBIDDEN_DIRECTIVE.test(source)) {
        return NextResponse.json({ error: "Remote includes and executable PlantUML directives are not allowed." }, { status: 400 });
    }

    const rendererUrl = process.env.PLANTUML_SERVER_URL?.trim();
    if (!rendererUrl) {
        return NextResponse.json({ error: "PlantUML preview is not configured. You can still copy or download the generated source." }, { status: 503 });
    }

    try {
        const response = await fetch(rendererUrl, {
            method: "POST",
            headers: { "content-type": "text/plain; charset=utf-8", accept: "image/svg+xml" },
            body: source,
            signal: AbortSignal.timeout(15_000),
            cache: "no-store",
        });
        const svg = await response.text();
        if (!response.ok || !/^\s*<svg\b/i.test(svg)) {
            return NextResponse.json({ error: "The configured PlantUML renderer rejected this diagram." }, { status: 422 });
        }
        return new NextResponse(svg, {
            status: 200,
            headers: {
                "content-type": "image/svg+xml; charset=utf-8",
                "cache-control": "private, max-age=300",
                "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "x-content-type-options": "nosniff",
            },
        });
    } catch {
        return NextResponse.json({ error: "The configured PlantUML renderer is unavailable." }, { status: 502 });
    }
}
