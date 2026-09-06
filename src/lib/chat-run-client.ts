type ChatRunRequest =
    | { scope: "repo"; owner: string; repo: string }
    | { scope: "profile"; username: string };

type ChatRunResponse = {
    runId?: string | null;
    persistence?: "enabled" | "disabled";
    error?: string;
    code?: string;
};

/** A null run is valid only when the server explicitly disables persistence. */
export async function createChatRun(
    conversation: ChatRunRequest,
): Promise<string | null> {
    const clientRequestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
    const response = await fetch("/api/chat/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...conversation, clientRequestId }),
    });
    const body = (await response
        .json()
        .catch(() => null)) as ChatRunResponse | null;

    if (!response.ok) {
        const error = new Error(
            body?.error ||
                "Unable to start this conversation. Please try again.",
        ) as Error & { status: number; code?: string };
        error.status = response.status;
        error.code = body?.code;
        throw error;
    }
    if (body?.persistence === "disabled" && body.runId === null) {
        return null;
    }
    if (typeof body?.runId === "string" && body.runId.trim()) {
        return body.runId;
    }
    throw new Error(
        "The server did not return a valid conversation. Please try again.",
    );
}
