import { auth } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-guard";
import { getUserEntitlement } from "@/lib/plans";

export async function GET() {
  const userId = getSessionUserId(await auth());
  const entitlement = await getUserEntitlement(userId);
  return Response.json(entitlement);
}
