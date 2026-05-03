import express from 'express';
import { markLeadReplied } from '../services/leadStore.js';
import { validateWebhookSignature } from '../services/ghl.js';

const router = express.Router();

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
