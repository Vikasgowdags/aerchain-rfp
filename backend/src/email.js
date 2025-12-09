// backend/src/email.js
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

dotenv.config();

// ---------- SMTP transport (send emails) ----------
const smtpTransport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false, // true if you use 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send an email (used by /api/email/send)
export async function sendEmail({ to, subject, text, html }) {
  const info = await smtpTransport.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
  return info;
}

// ---------- IMAP (read inbox) ----------
export async function fetchInbox(limit = 5) {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
  });

  await client.connect();
  await client.mailboxOpen("INBOX");

  const messages = [];
  const startSeq = Math.max(client.mailbox.exists - limit + 1, 1);

  for await (const msg of client.fetch(
    { seq: `${startSeq}:*` },
    { envelope: true, internalDate: true }
  )) {
    messages.push({
      seq: msg.seq,
      subject: msg.envelope.subject,
      from: msg.envelope.from?.map((x) => x.address).join(", "),
      date: msg.internalDate,
    });
  }

  await client.logout();

  // newest first
  return messages.reverse();
}
