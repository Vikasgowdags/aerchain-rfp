// backend/src/ai.js
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------
// 1) AI: Parse vendor email → structured proposal
// ------------------------------
export async function parseProposalEmail(emailBody) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract price, delivery days, payment terms, and warranty from vendor emails. Return clean JSON only.",
      },
      {
        role: "user",
        content: `
Vendor email:
---
${emailBody}
---

Extract these fields:

- totalPrice (number only)
- deliveryDays (number)
- paymentTerms (string)
- warrantyYears (number)

If missing, set to null.

Return JSON ONLY.
        `,
      },
    ],
  });

  let json;
  try {
    json = JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    json = {};
  }

  return {
    totalPrice: typeof json.totalPrice === "number" ? json.totalPrice : null,
    deliveryDays: typeof json.deliveryDays === "number" ? json.deliveryDays : null,
    paymentTerms: typeof json.paymentTerms === "string" ? json.paymentTerms : null,
    warrantyYears: typeof json.warrantyYears === "number" ? json.warrantyYears : null,
  };
}

// ------------------------------
// 2) AI: Compare proposals & recommend vendor
// ------------------------------
export async function summarizeRfpProposals(rfp, proposals) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Compare vendor proposals and recommend the best one. Return JSON summary.",
      },
      {
        role: "user",
        content: `
RFP:
${JSON.stringify(rfp, null, 2)}

Proposals:
${JSON.stringify(
  proposals.map((p) => ({
    id: p.id,
    vendorName: p.vendor?.name,
    vendorEmail: p.vendor?.email,
    totalPrice: p.totalPrice,
    deliveryDays: p.deliveryDays,
    paymentTerms: p.paymentTerms,
    warrantyYears: p.warrantyYears,
  })),
  null,
  2
)}

Return JSON:
{
  "summary": "string",
  "recommendedVendorName": "string or null",
  "recommendedVendorId": number or null,
  "reasoning": "string",
  "rankedVendors": [
    { "vendorId": number, "vendorName": "string", "score": number, "notes": "string" }
  ]
}
        `,
      },
    ],
  });

  let json;
  try {
    json = JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    json = {};
  }

  return {
    summary: json.summary ?? "",
    recommendedVendorName: json.recommendedVendorName ?? null,
    recommendedVendorId: json.recommendedVendorId ?? null,
    reasoning: json.reasoning ?? "",
    rankedVendors: Array.isArray(json.rankedVendors) ? json.rankedVendors : [],
  };
}
// ------------------------------
// 3) AI: Summarize RFP into short summary + key points
// ------------------------------
export async function summarizeRfp(description) {
  const prompt = `
Summarize this RFP and extract 4–6 bullet points.

RFP Description:
${description}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.choices[0].message.content || "";
  const parts = text.split("\n");

  const summary = parts[0];
  const keyPoints = parts.slice(1).filter((x) => x.trim() !== "");

  return {
    summary,
    keyPoints,
  };
}

// ------------------------------
// 4) AI: Score vendor proposal against RFP
// ------------------------------
export async function evaluateProposal(rfpText, proposalText) {
  const prompt = `
Evaluate this vendor proposal against the RFP.

RFP:
${rfpText}

Proposal:
${proposalText}

Return:
- Score (0-100)
- Short explanation
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const out = res.choices[0].message.content || "";

  const scoreMatch = out.match(/\b(\d{1,3})\b/);
  const score = scoreMatch ? Number(scoreMatch[1]) : null;

  return {
    aiScore: score,
    aiAnalysis: out,
  };
}
