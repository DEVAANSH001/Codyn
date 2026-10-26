"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function AdminSubmitButton({
    children,
    pendingLabel = "Working...",
    className,
}: {
    children: React.ReactNode;
    pendingLabel?: string;
    className: string;
}) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {pending ? pendingLabel : children}
        </button>
    );
}
