import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { markLeadOpened, markLeadReplied } from './leadStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRACKING_STORE_PATH = path.join(__dirname, 'data', 'tracking.json');

function createId(leadId) {
  return `${leadId || 'lead'}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readTrackingStore() {
  try {
    const raw = await fs.readFile(TRACKING_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeTrackingStore(records) {
  await fs.writeFile(TRACKING_STORE_PATH, JSON.stringify(records, null, 2));
}

export async function createTrackingId(leadId) {
  const records = await readTrackingStore();
  const trackingId = createId(leadId);

  records.push({
    tracking_id: trackingId,
    lead_id: leadId,
    sent_at: new Date().toISOString(),
    opened_at: null,
    replied_at: null,
  });

  await writeTrackingStore(records);
  return trackingId;
}

export async function markOpened(trackingId) {
  const records = await readTrackingStore();
  const idx = records.findIndex((item) => item.tracking_id === trackingId);
  if (idx < 0) return null;

  if (!records[idx].opened_at) {
    records[idx].opened_at = new Date().toISOString();
    await writeTrackingStore(records);
  }

  if (records[idx].lead_id) {
    await markLeadOpened(records[idx].lead_id);
  }

  return records[idx];
}

export async function markReplied(trackingId) {
  const records = await readTrackingStore();
  const idx = records.findIndex((item) => item.tracking_id === trackingId);
  if (idx < 0) return null;

  if (!records[idx].replied_at) {
    records[idx].replied_at = new Date().toISOString();
    await writeTrackingStore(records);
  }

  if (records[idx].lead_id) {
    await markLeadReplied(records[idx].lead_id);
  }

  return records[idx];
}

export async function getTrackingStats() {
  const records = await readTrackingStore();
  const sent = records.length;
  const opened = records.filter((item) => item.opened_at).length;
  const replied = records.filter((item) => item.replied_at).length;

  return {
    sent,
    opened,
    replied,
  };
}
