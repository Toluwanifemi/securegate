import nodemailer from "nodemailer";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;
  const host = process.env.SMTP_HOST;

  if (!host || !from) {
    console.warn("[EMAIL] SMTP not configured — logging email to console");
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true };
  }

  try {
    const html = renderToString(template);
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[EMAIL_ERROR]", err);
    return { success: false, error: "Failed to send email" };
  }
}
