import express from 'express';
import { findSupervisors } from '../services/leadFinder.js';
import { upsertLead, getAllLeads, markLeadReplied } from '../services/leadStore.js';

const router = express.Router();

// manual lead input
router.post('/add', async (req, res) => {
  try {
    const saved = await upsertLead(req.body);
    res.json({ success: true, lead: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

router.post('/:id/replied', async (req, res) => {
  try {
    const updated = await markLeadReplied(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json({ success: true, lead: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update lead reply status' });
  }
});

router.get('/', async (_req, res) => {
  const leads = await getAllLeads();
  res.json(leads);
});

// auto lead finder
router.get('/find', async (_req, res) => {
  try {
    const leads = await findSupervisors();
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

export default router;
