import express from 'express';
import dotenv from 'dotenv';

import leadsRoutes from './routes/leads.js';
import outreachRoutes from './routes/outreach.js';
import { markOpened, getTrackingStats } from './services/tracking.js';
import { getAllLeads } from './services/leadStore.js';

dotenv.config();

const app = express();
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.send('Resonova Agent is live 🚀');
});

app.get('/track/open/:id', async (req, res) => {
  try {
    await markOpened(req.params.id);
  } catch (err) {
    console.error('Tracking pixel open error:', err);
  }

  const pixel = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(pixel);
});

app.get('/analytics', async (_req, res) => {
  try {
    const leads = await getAllLeads();
    const tracking = await getTrackingStats();

    const totalLeads = leads.length;
    const contacted = leads.filter((lead) => Number(lead.outreach_count || 0) > 0).length;
    const replied = leads.filter((lead) => lead.status === 'replied').length;
    const openRate = contacted ? Number(((tracking.opened / contacted) * 100).toFixed(2)) : 0;
    const replyRate = contacted ? Number(((replied / contacted) * 100).toFixed(2)) : 0;

    res.json({
      total_leads: totalLeads,
      contacted,
      replied,
      open_rate: openRate,
      reply_rate: replyRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// routes
app.use('/leads', leadsRoutes);
app.use('/outreach', outreachRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
