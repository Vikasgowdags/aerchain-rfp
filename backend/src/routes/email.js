import express from "express";
import { sendEmail, fetchInbox } from "../email.js";

const router = express.Router();

// POST /api/email/send
router.post("/send", async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    const info = await sendEmail({ to, subject, text, html });
    res.json({ message: "Email sent", id: info.messageId });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// GET /api/email/inbox?limit=5
router.get("/inbox", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const messages = await fetchInbox(limit);
    res.json(messages);
  } catch (err) {
    console.error("Inbox fetch error:", err);
    res.status(500).json({ error: "Failed to load inbox" });
  }
});

export default router;
