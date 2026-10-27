import PaymentPlans from "@/components/dashboard/PaymentPlans";
import { listNebiusModelCatalog } from "@/lib/nebius";

export default async function DashboardPlansPage() {
  const catalog = await listNebiusModelCatalog().catch(() => []);
  return <PaymentPlans catalog={catalog} />;
}
