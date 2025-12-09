import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

/**
 * POST /api/vendors
 * Body: { "name": "ABC Supplies", "email": "abc@example.com", "category": "IT Hardware" }
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, category } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    // create vendor in DB
    const vendor = await prisma.vendor.create({
      data: {
        name,
        email,
        category: category || null,
      },
    });

    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);

    // handle unique email error
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Vendor with this email already exists" });
    }

    res.status(500).json({ error: "Failed to create vendor" });
  }
});

/**
 * GET /api/vendors
 * Returns list of vendors with proposal count
 */
router.get("/", async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        proposals: true,
      },
    });

    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

export default router;
