import express from 'express';
import { generateEmail } from '../services/ai.js';
import { sendEmail } from '../services/email.js';
import { upsertLead, markLeadContacted } from '../services/leadStore.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { name, email, project, track } = req.body;

    const message = await generateEmail({ name, project, track });

    await sendEmail(email, 'Quick idea for your project', message);

    const lead = await upsertLead({ name, email, project, track });
    await markLeadContacted(lead.id);

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send outreach' });
  }
});

export default router;
