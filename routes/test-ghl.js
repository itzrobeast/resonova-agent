import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const locationId = "6g4YmN9rwP8Q9Qk5njSW";
    const apiKey = "pit-REPLACE_ME";

    const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
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
