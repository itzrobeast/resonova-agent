import express from 'express';
import dotenv from 'dotenv';

import leadsRoutes from './routes/leads.js';
import outreachRoutes from './routes/outreach.js';
import ghlRoutes from './routes/ghl.js';

dotenv.config();

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.get('/', (req, res) => {
  res.send('Resonova API live 🚀');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ✅ FIXED GHL TEST ROUTE
app.get('/test-ghl', async (req, res) => {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${process.env.GHL_LOCATION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/leads', leadsRoutes);
app.use('/outreach', outreachRoutes);
app.use('/ghl', ghlRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
