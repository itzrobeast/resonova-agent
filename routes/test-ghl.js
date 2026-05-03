import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const apiKey = process.env.GHL_API_KEY;

    const response = await fetch(
      "https://services.leadconnectorhq.com/locations/",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28"
        }
      }
    );

    const data = await response.text();

    res.json({
      status: response.status,
      data
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default router;
