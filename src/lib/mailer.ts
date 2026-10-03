import nodemailer, { type Transporter } from "nodemailer";

// Outgoing email over SMTP (Nodemailer). Works with any provider that offers
// SMTP: Gmail, Brevo, Mailgun, Amazon SES, Resend, Zoho, your web host, etc.
//
//   SMTP_HOST      e.g. smtp-relay.brevo.com
//   SMTP_PORT      587 (STARTTLS, default) or 465 (TLS)
//   SMTP_USER      SMTP username
//   SMTP_PASS      SMTP password or app password
//   SMTP_FROM      sender shown to readers, e.g. "My Blog <news@example.com>"

const REQUIRED = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;

/** SMTP settings that still need to be set; empty when email is ready to send. */
export function missingMailerSettings(): string[] {
  return REQUIRED.filter((key) => !process.env[key]?.trim());
}

export function isMailerConfigured(): boolean {
  return missingMailerSettings().length === 0;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!isMailerConfigured()) throw new Error(`Email is not configured. Missing: ${missingMailerSettings().join(", ")}`);
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Reuse connections when sending a newsletter to many readers.
      pool: true,
      maxConnections: 3,
    });
  }
  return transporter;
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function sendMail(mail: Mail): Promise<void> {
  await getTransporter().sendMail({ from: process.env.SMTP_FROM, ...mail });
}
