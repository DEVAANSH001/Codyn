export async function POST() {
  return Response.json({ error: "New purchases require a monthly subscription. Open the plans page to continue." }, { status: 410 });
}
