import "server-only";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends transactional email through Resend's HTTP API.
 * Without RESEND_API_KEY (local development) the message is logged instead,
 * so password-reset and verification links can be copied from the console.
 */
export async function sendEmail({ to, subject, text, html }: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY not set. Would send to ${to}: ${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Joan's Kitchen <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send email (${res.status}): ${await res.text()}`);
  }
}
