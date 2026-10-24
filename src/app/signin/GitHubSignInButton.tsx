"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";

export function GitHubSignInButton({ callbackUrl, scope }: { callbackUrl: string; scope: string }) {
  const started = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    if (started.current) return;
    started.current = true;
    setPending(true);
    setError("");
    try {
      await signIn("github", { callbackUrl }, { scope });
    } catch {
      started.current = false;
      setPending(false);
      setError("GitHub sign-in could not start. Please try again.");
    }
  }

  return (
    <div className="mt-8">
      <button type="button" onClick={() => void handleSignIn()} disabled={pending}
        className="codyn-primary-action flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60">
        <Github size={18} /> {pending ? "Connecting to GitHub…" : "Continue with GitHub"}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
    </div>
  );
}
