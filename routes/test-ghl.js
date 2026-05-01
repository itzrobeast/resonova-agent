import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const locationId = "6g4YmN9rwP8Q9Qk5njSW";
    const apiKey = "pit-9df35977-7326-4fbc-8ac2-94d564c31a36";

    const response = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        LocationId: locationId,
      },
      body: JSON.stringify({
        locationId,
        firstName: "Test",
        lastName: "User",
        email: "test2@example.com"
      }),
    });

    const data = await response.json();
    res.json({ status: response.status, data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to GHL");
  }
});

export default router;
