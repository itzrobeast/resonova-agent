import express from "express";
import { findSupervisors } from "../services/leadFinder.js";

const router = express.Router();

// manual lead input
router.post("/add", async (req, res) => {
  const lead = req.body;

  console.log("Manual Lead Added:", lead);

  res.json({ success: true, lead });
});

// auto lead finder
router.get("/find", async (req, res) => {
  try {
    const leads = await findSupervisors();
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

export default router;
