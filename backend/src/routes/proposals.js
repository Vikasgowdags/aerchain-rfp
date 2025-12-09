// backend/src/routes/proposals.js
import express from "express";
import { prisma } from "../db.js";
import {
  evaluateProposal,
  parseProposalEmail,
  summarizeRfpProposals,
} from "../ai.js";

const router = express.Router();

//
// =================== CREATE PROPOSAL (from UI – AI scored) ===================
//  POST /api/proposals
//
router.post("/", async (req, res) => {
  try {
    const {
      rfpId,
      vendorId,
      totalPrice,
      deliveryDays,
      paymentTerms,
      warrantyYears,
      rawEmailBody,
      items,
      itemsJson,
    } = req.body;

    const rfpIdNum = Number(rfpId);
    const vendorIdNum = Number(vendorId);

    if (!rfpIdNum || !vendorIdNum) {
      return res.status(400).json({ error: "rfpId and vendorId are required" });
    }

    // 1) Look up the RFP text so AI can compare
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpIdNum },
    });

    if (!rfp) {
      return res.status(400).json({ error: "RFP not found for given rfpId" });
    }

    // 2) Build proposal text for AI (if user didn’t paste an email)
    const proposalText =
      rawEmailBody &&
      rawEmailBody.trim().length > 0
        ? rawEmailBody
        : `
Total price: ${totalPrice ?? "N/A"}
Delivery days: ${deliveryDays ?? "N/A"}
Payment terms: ${paymentTerms ?? "N/A"}
Warranty years: ${warrantyYears ?? "N/A"}
    `.trim();

    // 3) Ask AI to score + analyse
    const ai = await evaluateProposal(rfp.description || "", proposalText);

    // 4) Ensure itemsJson is a string if you ever send items[]
    const itemsJsonValue =
      typeof itemsJson === "string"
        ? itemsJson
        : items
        ? JSON.stringify(items)
        : null;

    // 5) Save proposal with AI fields
    const proposal = await prisma.proposal.create({
      data: {
        rfpId: rfpIdNum,
        vendorId: vendorIdNum,
        totalPrice: totalPrice != null ? Number(totalPrice) : null,
        deliveryDays: deliveryDays != null ? Number(deliveryDays) : null,
        paymentTerms: paymentTerms || null,
        warrantyYears: warrantyYears != null ? Number(warrantyYears) : null,
        rawEmailBody: rawEmailBody || "",
        itemsJson: itemsJsonValue,
        aiScore: ai.aiScore,
        aiAnalysis: ai.aiAnalysis,
      },
      include: { vendor: true },
    });

    res.json(proposal);
  } catch (err) {
    console.error("Create proposal error:", err);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

//
// =================== AI PARSE PROPOSAL FROM EMAIL ===================
//  POST /api/proposals/parse-email
//
router.post("/parse-email", async (req, res) => {
  try {
    const { emailBody, rfpId, vendorId } = req.body;

    if (!emailBody || !rfpId || !vendorId) {
      return res
        .status(400)
        .json({ error: "emailBody, rfpId and vendorId are required" });
    }

    const rfpIdNum = Number(rfpId);
    const vendorIdNum = Number(vendorId);

    // Run AI extraction
    const parsed = await parseProposalEmail(emailBody);

    const saved = await prisma.proposal.create({
      data: {
        rfpId: rfpIdNum,
        vendorId: vendorIdNum,
        rawEmailBody: emailBody,
        totalPrice: parsed.totalPrice,
        deliveryDays: parsed.deliveryDays,
        paymentTerms: parsed.paymentTerms,
        warrantyYears: parsed.warrantyYears,
        itemsJson: null,
        aiScore: null,
        aiAnalysis: null,
      },
      include: { vendor: true },
    });

    res.json({
      message: "Email parsed & proposal created",
      proposal: saved,
      extracted: parsed,
    });
  } catch (err) {
    console.error("AI parse error:", err);
    res.status(500).json({ error: "AI failed to parse email" });
  }
});

//
// =================== GET PROPOSALS FOR A SPECIFIC RFP ===================
//  GET /api/proposals?rfpId=1
//
router.get("/", async (req, res) => {
  try {
    const rfpIdNum = Number(req.query.rfpId);

    if (!rfpIdNum) {
      return res
        .status(400)
        .json({ error: "rfpId query parameter is required" });
    }

    const proposals = await prisma.proposal.findMany({
      where: { rfpId: rfpIdNum },
      include: { vendor: true },
      orderBy: { id: "desc" },
    });

    res.json(proposals);
  } catch (err) {
    console.error("Fetch proposals error:", err);
    res.status(500).json({ error: "Failed to load proposals" });
  }
});

//
// =================== AI SUMMARY — RECOMMEND BEST VENDOR ===================
//  GET /api/proposals/summary/:rfpId
//
router.get("/summary/:rfpId", async (req, res) => {
  try {
    const rfpIdNum = Number(req.params.rfpId);

    const rfp = await prisma.rfp.findUnique({ where: { id: rfpIdNum } });
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    const proposals = await prisma.proposal.findMany({
      where: { rfpId: rfpIdNum },
      include: { vendor: true },
    });

    const summary = await summarizeRfpProposals(rfp, proposals);

    res.json(summary);
  } catch (err) {
    console.error("AI summary error:", err);
    res.status(500).json({ error: "Failed to summarize proposals" });
  }
});

export default router;
