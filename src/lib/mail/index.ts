import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { env, isProduction } from "@/config/env";
import { logger } from "@/lib/logger";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | undefined;

/** One pooled-per-process SMTP transport, or null when no SMTP server is configured. */
function smtp(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env();
  if (!SMTP_HOST) return null;
  const secure = SMTP_SECURE ?? SMTP_PORT === 465;
  transporter ??= createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    // Reset links must never cross the wire in clear text: in production, refuse servers without STARTTLS.
    requireTLS: !secure && isProduction(),
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

/**
 * Transactional email over SMTP (Nodemailer) when SMTP_HOST is set. Without it,
 * development logs the message (so reset links are usable locally) and production
 * logs a warning without the message body.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const transport = smtp();

  if (!transport) {
    if (!isProduction()) {
      logger.info("[mail:dev] Email not sent (no SMTP_HOST). Contents:", {
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
    await transport.sendMail({ from: env().MAIL_FROM, to: message.to, subject: message.subject, text: message.text, html: message.html });
    return true;
  } catch (error) {
    logger.error("Email send failed", { error, subject: message.subject });
    return false;
  }
}
