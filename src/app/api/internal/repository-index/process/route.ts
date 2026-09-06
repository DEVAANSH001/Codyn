import { NextRequest, NextResponse } from "next/server";
import { processNextRepositoryIndexJob } from "@/lib/services/repository-index-worker";

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.REPOSITORY_INDEX_JOB_SECRET?.trim();
    if (!secret) return false;
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : request.headers.get("x-job-secret");
    return token === secret;
}

async function handleProcess(request: NextRequest) {
    if (!process.env.REPOSITORY_INDEX_JOB_SECRET?.trim()) {
        return NextResponse.json({ error: "REPOSITORY_INDEX_JOB_SECRET is not configured." }, { status: 500 });
    }
    if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await processNextRepositoryIndexJob();
    return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
    return handleProcess(request);
}

export async function POST(request: NextRequest) {
    return handleProcess(request);
}
