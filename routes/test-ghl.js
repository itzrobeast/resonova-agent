import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    console.log("API KEY:", process.env.GHL_API_KEY);
    console.log("LOCATION ID:", process.env.GHL_LOCATION_ID);

    const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${process.env.GHL_LOCATION_ID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
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
