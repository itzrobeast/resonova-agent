import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

import leadsRoutes from './routes/leads.js';
import outreachRoutes from './routes/outreach.js';
import { markOpened, getTrackingStats } from './services/tracking.js';
import { getAllLeads } from './services/leadStore.js';

dotenv.config();

const app = express();
app.use(express.json());

// ===== INIT SERVICES =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== BASIC ROUTES =====
app.get('/', (req, res) => {
  res.send('Resonova Agent is live 🚀');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ===== TEST ROUTES =====

// 1) EMAIL
app.get('/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Resonova Test Email',
      text: 'Email is working 🚀'
    });
    res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2) SUPABASE
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ full_name: 'Test User', email: `test_${Date.now()}@test.com` }])
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3) GHL (FIXED)
app.get('/test-ghl', async (req, res) => {
  try {
    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: '2021-07-28'
      }
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== EXISTING =====
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

app.use('/leads', leadsRoutes);
app.use('/outreach', outreachRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
