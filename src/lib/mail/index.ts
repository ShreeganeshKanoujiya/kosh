import "server-only";
import { logger } from "@/lib/logger";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Transactional email. Uses Resend (https://resend.com) when RESEND_API_KEY is set.
 * Without a provider, development logs the message (so reset links are usable
 * locally) and production logs a warning without the message body.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Kosh <no-reply@example.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.info("[mail:dev] Email not sent (no RESEND_API_KEY). Contents:", {
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } else {
      logger.warn("Email provider not configured; message dropped", { subject: message.subject });
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.error("Email provider rejected message", { status: res.status, subject: message.subject });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Email send failed", { error, subject: message.subject });
    return false;
  }
}
