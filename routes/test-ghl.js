import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    console.log("=== DEBUG START ===");
    console.log("API KEY EXISTS:", !!apiKey);
    console.log("API KEY (first 10):", apiKey?.slice(0, 10));
    console.log("LOCATION ID:", locationId);

    const response = await fetch(
      "https://services.leadconnectorhq.com/users/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28"
        }
      }
    );

    console.log("STATUS:", response.status);
    console.log("HEADERS:", Object.fromEntries(response.headers.entries()));

    const text = await response.text();

    console.log("RAW RESPONSE:", text);
    console.log("=== DEBUG END ===");

    res.json({
      status: response.status,
      body: text
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send(error.message);
  }
});

export default router;
