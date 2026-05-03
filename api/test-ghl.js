export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const apiKey = process.env.GHL_API_KEY;

    console.log("=== DEBUG START ===");
    console.log("API KEY EXISTS:", !!apiKey);
    console.log("API KEY (first 10):", apiKey?.slice(0, 10));

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

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", text);
    console.log("=== DEBUG END ===");

    res.status(200).json({
      status: response.status,
      body: text
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send(error.message);
  }
}
