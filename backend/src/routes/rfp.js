// backend/src/routes/rfp.js
import express from "express";
import { prisma } from "../db.js";

const router = express.Router();

//
// ============== CREATE RFP (simple, used by frontend) ==============
//  POST /api/rfps
//
router.post("/", async (req, res) => {
  try {
    const { title, description, budget } = req.body;

    console.log("Incoming RFP request body:", req.body);

    const saved = await prisma.rFP.create({
      data: {
        title,
        description,
        budget: budget != null ? Number(budget) : null,
      },
    });

    res.json(saved);
  } catch (err) {
    console.error("Create RFP error:", err);
    res.status(500).json({ error: "Failed to create RFP" });
  }
});

//
// ============== LIST ALL RFPs ==============
//  GET /api/rfps
//
router.get("/", async (req, res) => {
  try {
    const rfps = await prisma.rFP.findMany({
      orderBy: { id: "desc" },
    });

    res.json(rfps);
  } catch (err) {
    console.error("Load RFPs error:", err);
    res.status(500).json({ error: "Failed to load RFPs" });
  }
});

export default router;
