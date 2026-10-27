import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function SubscriptionReceiptEmail({ name, planName, amount, chargedAt }: { name: string; planName: string; amount: number; chargedAt: Date }) {
  return <Html><Head /><Preview>Thank you for your Codyn subscription</Preview><Body style={{ backgroundColor: "#090c11", color: "#f4f4f5", fontFamily: "Arial, sans-serif", padding: "32px" }}><Container style={{ maxWidth: "560px", margin: "0 auto" }}>
    <Heading>Thanks for subscribing, {name}!</Heading>
    <Text>Your {planName} subscription payment was confirmed.</Text>
    <Text>Amount: ₹{(amount / 100).toLocaleString("en-IN")} · Paid on {chargedAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</Text>
    <Text>Your plan renews monthly until you cancel. You can view or cancel it from your Codyn plans page.</Text>
    <Text>Thank you for choosing Codyn.</Text>
  </Container></Body></Html>;
}
