import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const locationId = "6g4YmN9rwP8Q9Qk5njSW";
    const apiKey = "pit-9df35977-7326-4fbc-8ac2-94d564c31a36";

    const response = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/?locationId=${locationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    res.json({
      status: response.status,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to GHL");
  }
});

export default router;
