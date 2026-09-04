import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { SavedReport } from '@/components/repository/SavedReport';
export const metadata = { title: 'Local security report — Codyn', robots: { index: false, follow: false }, openGraph: { images: [] }, twitter: { images: [] } };
export default async function ReportPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  return <DashboardShell><SavedReport id={scanId} /></DashboardShell>;
}
