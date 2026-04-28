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
    outreach_count: Number(lead.outreach_count || 0),
    last_contacted_at: lead.last_contacted_at || lead.last_contacted || null,
    last_opened_at: lead.last_opened_at || null,
    last_replied_at: lead.last_replied_at || lead.last_reply_at || null,
    last_reply_message: lead.last_reply_message || null,
    reply_intent: lead.reply_intent || null,
    reply_confidence: Number(lead.reply_confidence || 0),
    high_priority: Boolean(lead.high_priority),
    requires_human: Boolean(lead.requires_human),
    conversation: Array.isArray(lead.conversation) ? lead.conversation : [],
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
    status: normalized.status || existing?.status || 'new',
    outreach_count: Number(normalized.outreach_count || existing?.outreach_count || 0),
    last_contacted_at: normalized.last_contacted_at || existing?.last_contacted_at || existing?.last_contacted || null,
    last_contacted: normalized.last_contacted_at || existing?.last_contacted_at || existing?.last_contacted || null,
    last_opened_at: normalized.last_opened_at || existing?.last_opened_at || null,
    last_replied_at: normalized.last_replied_at || existing?.last_replied_at || existing?.last_reply_at || null,
    last_reply_at: normalized.last_replied_at || existing?.last_replied_at || existing?.last_reply_at || null,
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

  const nowIso = new Date().toISOString();

  leads[idx] = {
    ...leads[idx],
    status: leads[idx].status === 'new' ? 'contacted' : leads[idx].status,
    outreach_count: Number(leads[idx].outreach_count || 0) + 1,
    last_contacted_at: nowIso,
    last_contacted: nowIso,
  };

  await writeStore(leads);
  await updateOpportunityStage(leads[idx], 'contacted');
  return leads[idx];
}

export async function markLeadOpened(leadId) {
  const leads = await readStore();
  const idx = leads.findIndex((lead) => lead.id === leadId);
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  leads[idx] = {
    ...leads[idx],
    status: leads[idx].status === 'replied' || leads[idx].status === 'closed' ? leads[idx].status : 'engaged',
    last_opened_at: nowIso,
  };

  await writeStore(leads);
  return leads[idx];
}

export async function markLeadReplied(leadId, replyDetails = {}) {
  const leads = await readStore();
  const idx = leads.findIndex((lead) => lead.id === leadId);
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();

  const existingConversation = Array.isArray(leads[idx].conversation) ? leads[idx].conversation : [];
  const nextConversation = [...existingConversation];

  if (replyDetails.message) {
    nextConversation.push({ role: 'user', message: replyDetails.message, timestamp: nowIso });
  }

  if (replyDetails.system_response) {
    nextConversation.push({ role: 'system', message: replyDetails.system_response, timestamp: nowIso });
  }

  leads[idx] = {
    ...leads[idx],
    status: 'replied',
    last_replied_at: nowIso,
    last_reply_at: nowIso,
    last_reply_message: replyDetails.message || leads[idx].last_reply_message || null,
    reply_intent: replyDetails.intent || leads[idx].reply_intent || 'other',
    reply_confidence: Number(replyDetails.confidence ?? leads[idx].reply_confidence ?? 0),
    next_touch_at: null,
    automation_paused: true,
    high_priority: Boolean(replyDetails.high_priority ?? leads[idx].high_priority),
    requires_human: Boolean(replyDetails.requires_human ?? leads[idx].requires_human),
    conversation: nextConversation,
  };

  await writeStore(leads);
  await updateOpportunityStage(leads[idx], 'replied');
  return leads[idx];
}

export async function getLeadsForFollowUp({ max = 20, minHoursSinceContact = 24 } = {}) {
  const leads = await readStore();
  const now = Date.now();
  const minMs = minHoursSinceContact * 60 * 60 * 1000;

  return leads
    .filter((lead) => {
      if (lead.status === 'closed' || lead.status === 'replied') return false;
      if (!lead.last_contacted_at && !lead.last_contacted) return true;
      const lastContact = new Date(lead.last_contacted_at || lead.last_contacted).getTime();
      if (Number.isNaN(lastContact)) return true;
      return now - lastContact >= minMs;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, max);
}
