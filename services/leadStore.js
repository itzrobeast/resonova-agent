import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoreLead } from './leadScoring.js';
import { createOrUpdateContact, updateOpportunityStage } from './crm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, 'data', 'leads.json');

function normalizeLead(lead) {
  return {
    ...lead,
    id: lead.id || lead.email || lead.link || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: (lead.name || '').trim(),
    email: (lead.email || '').trim().toLowerCase(),
    company: (lead.company || '').trim(),
    status: lead.status || 'new',
    followUpCount: Number(lead.followUpCount || 0),
  };
}

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(leads) {
  await fs.writeFile(STORE_PATH, JSON.stringify(leads, null, 2));
}

export async function upsertLead(inputLead) {
  const leads = await readStore();
  const normalized = normalizeLead(inputLead);
  const nowIso = new Date().toISOString();

  const index = leads.findIndex((lead) =>
    (normalized.email && lead.email === normalized.email) ||
    (normalized.link && lead.link === normalized.link) ||
    lead.id === normalized.id
  );

  const existing = index >= 0 ? leads[index] : null;
  const merged = {
    ...(existing || {}),
    ...normalized,
    score: scoreLead({ ...(existing || {}), ...normalized }),
    updatedAt: nowIso,
    createdAt: existing?.createdAt || nowIso,
  };

  if (index >= 0) {
    leads[index] = merged;
  } else {
    leads.push(merged);
    await createOrUpdateContact(merged);
  }

  await writeStore(leads);
  return merged;
}

export async function getAllLeads() {
  return readStore();
}

export async function markLeadContacted(leadId) {
  const leads = await readStore();
  const idx = leads.findIndex((lead) => lead.id === leadId);
  if (idx < 0) return null;

  leads[idx] = {
    ...leads[idx],
    status: 'contacted',
    last_contacted: new Date().toISOString(),
  };

  await writeStore(leads);
  await updateOpportunityStage(leads[idx], 'contacted');
  return leads[idx];
}

export async function markLeadReplied(leadId) {
  const leads = await readStore();
  const idx = leads.findIndex((lead) => lead.id === leadId);
  if (idx < 0) return null;

  leads[idx] = {
    ...leads[idx],
    status: 'replied',
    last_reply_at: new Date().toISOString(),
  };

  await writeStore(leads);
  await updateOpportunityStage(leads[idx], 'replied');
  return leads[idx];
}

export async function getLeadsForFollowUp({ max = 20, minHoursSinceContact = 48 } = {}) {
  const leads = await readStore();
  const now = Date.now();
  const minMs = minHoursSinceContact * 60 * 60 * 1000;

  return leads
    .filter((lead) => {
      if (lead.status === 'closed') return false;
      if (!lead.last_contacted) return true;
      const lastContact = new Date(lead.last_contacted).getTime();
      if (Number.isNaN(lastContact)) return true;
      return now - lastContact >= minMs;
    })
    .sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      const aLast = a.last_contacted ? new Date(a.last_contacted).getTime() : 0;
      const bLast = b.last_contacted ? new Date(b.last_contacted).getTime() : 0;
      return aLast - bLast;
    })
    .slice(0, max);
}
