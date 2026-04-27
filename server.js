import express from "express";
import dotenv from "dotenv";

import leadsRoutes from "./routes/leads.js";
import outreachRoutes from "./routes/outreach.js";

dotenv.config();

const app = express();
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("Resonova Agent is live 🚀");
});

// routes
app.use("/leads", leadsRoutes);
app.use("/outreach", outreachRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
