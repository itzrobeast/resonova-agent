import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { markLeadReplied } from '../services/leadStore.js';
import { validateWebhookSignature } from '../services/ghl.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔥 CREATE CONTACT ROUTE
router.post('/create-contact', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    const response = await fetch(
      'https://services.leadconnectorhq.com/contacts/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          locationId: process.env.GHL_LOCATION_ID
        })
      }
    );

    const data = await response.json();
    console.log('[GHL][CREATE CONTACT]', data);

    // ✅ SAVE TO SUPABASE
    await supabase.from('leads').insert([
      {
        full_name: `${firstName} ${lastName}`,
        email,
        status: 'new'
      }
    ]);

    res.json(data);
  } catch (err) {
    console.error('[GHL][CREATE CONTACT][ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    if (!validateWebhookSignature(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    console.log('[GHL][WEBHOOK][RECEIVED]', JSON.stringify(payload));

    const eventType = payload.type || payload.eventType || 'unknown';
    const leadId = payload?.contact?.customFields?.find?.((f) => f.key === 'lead_id')?.value || payload?.leadId;

    if (eventType.includes('reply') && leadId) {
      await markLeadReplied(leadId, {
        message: payload?.message?.body || payload?.body || '',
        channel: payload?.message?.channel || 'ghl',
        source: 'ghl_webhook'
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[GHL][WEBHOOK][ERROR]', err);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
