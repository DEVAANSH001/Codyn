import type { Metadata } from "next";
import SeoLandingPage from "@/components/seo/SeoLandingPage";
import { getSeoPageMetadata, getSeoPageOrThrow } from "@/lib/seo-page-route";

const slug = "static-analysis-vs-codyn";

export const metadata: Metadata = getSeoPageMetadata(slug);

export default function StaticAnalysisVsCodynPage() {
  return <SeoLandingPage page={getSeoPageOrThrow(slug)} />;
}
