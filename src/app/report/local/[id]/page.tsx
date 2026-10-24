import type { Metadata } from "next";
import { SavedReport } from "@/components/repository/SavedReport";

export const metadata: Metadata = {
    title: "Browser saved scan | Codyn",
    robots: { index: false, follow: false },
};

export default async function LocalReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <main className="dashboard-grid min-h-dvh px-4 py-8 text-white sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
            <SavedReport id={id} />
        </div>
    </main>;
}
