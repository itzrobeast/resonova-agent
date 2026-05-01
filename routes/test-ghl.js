import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const response = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to GHL");
  }
});

export default router;
