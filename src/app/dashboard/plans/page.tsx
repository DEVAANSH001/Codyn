import PaymentPlans from "@/components/dashboard/PaymentPlans";
import { listNebiusModels } from "@/lib/nebius";

export default async function DashboardPlansPage() {
  const catalog = await listNebiusModels().catch(() => []);
  return <PaymentPlans catalog={catalog} />;
}
