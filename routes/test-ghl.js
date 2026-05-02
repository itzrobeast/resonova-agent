import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-ghl", async (req, res) => {
  try {
    const apiKey = "pit-7e36b387-26a8-45cf-8112-ef026da0824b";

    const response = await fetch(
      "https://services.leadconnectorhq.com/contacts/",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const data = await response.json();

    res.json({
      status: response.status,
      data
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to GHL");
  }
});

export default router;
