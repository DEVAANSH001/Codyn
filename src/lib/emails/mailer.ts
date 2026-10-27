import { Resend } from "resend";
import WelcomeEmail from "./welcome";
import SubscriptionReceiptEmail from "./subscription-receipt";

let resendClient: Resend | null = null;

export interface SendWelcomeEmailInput {
    to: string;
    username: string;
    idempotencyKey: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendSubscriptionReceipt(input: {
    to: string;
    name: string;
    planName: string;
    amount: number;
    chargedAt: Date;
    idempotencyKey: string;
}): Promise<SendEmailResult> {
    const client = getResendClient();
    const from = getFromEmail();
    if (!client || !from) return { success: false, error: "Email sender is not configured" };
    try {
        const { data, error } = await client.emails.send({
            from,
            to: [input.to],
            subject: `Thanks for subscribing to Codyn ${input.planName}`,
            react: SubscriptionReceiptEmail(input),
            tags: [{ name: "template", value: "subscription_receipt" }],
        }, { idempotencyKey: input.idempotencyKey });
        return error ? { success: false, error: `${error.name}: ${error.message}` } : { success: true, messageId: data?.id };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }

    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }

    return resendClient;
}

function getFromEmail(): string | null {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    return from ? from : null;
}

export async function sendWelcomeEmail({
    to,
    username,
    idempotencyKey,
}: SendWelcomeEmailInput): Promise<SendEmailResult> {
    const client = getResendClient();
    if (!client) {
        return {
            success: false,
            error: "RESEND_API_KEY is not configured",
        };
    }

    const from = getFromEmail();
    if (!from) {
        return {
            success: false,
            error: "RESEND_FROM_EMAIL is not configured",
        };
    }

    try {
        const { data, error } = await client.emails.send(
            {
                from,
                to: [to],
                subject: "Welcome to Codyn!",
                react: WelcomeEmail({ username }),
                tags: [
                    { name: "template", value: "welcome" },
                ],
            },
            { idempotencyKey }
        );

        if (error) {
            return {
                success: false,
                error: `${error.name}: ${error.message}`,
            };
        }

        return {
            success: true,
            messageId: data?.id,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: message,
        };
    }
}

export function getWebhookVerifierClient(): Resend {
    return new Resend(process.env.RESEND_API_KEY);
}
