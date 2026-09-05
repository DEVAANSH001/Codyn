import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/LogoMark";

export function BotIcon({ className }: { className?: string }) {
    return (
        <LogoMark className={cn("h-full w-full text-cyan-300", className)} />
    );
}
