import { generateEmail, generateFollowUpEmail, generateSubjectLine } from './ai.js';
import { sendEmail } from './email.js';
import { markLeadContacted } from './leadStore.js';
import { updateOpportunityStage } from './crm.js';
import { createTrackingId } from './tracking.js';

const MAX_EMAILS_PER_RUN = 20;
const MAX_EMAILS_PER_DOMAIN = 5;
const HOURS_24 = 24 * 60 * 60 * 1000;
const HOURS_48 = 48 * 60 * 60 * 1000;

function getDomain(email = '') {
  return String(email).split('@')[1]?.toLowerCase() || '';
}

function getTime(value) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function scheduleNextTouch(lead) {
  const now = Date.now();
  const lastContacted = getTime(lead.last_contacted_at || lead.last_contacted);
  const lastOpened = getTime(lead.last_opened_at);
  const lastReplied = getTime(lead.last_replied_at || lead.last_reply_at);

  if (lead.status === 'replied' || lead.status === 'closed' || lastReplied) {
    return { shouldSend: false, reason: 'lead_replied_or_closed' };
  }

  if (!lastContacted) {
    return { shouldSend: true, touchType: 'initial', variationIndex: Number(lead.outreach_count || 0) };
  }

  if (!lastOpened && now - lastContacted >= HOURS_48) {
    return { shouldSend: true, touchType: 'resend_no_open', variationIndex: Number(lead.outreach_count || 0) + 1 };
  }

  if (lastOpened && !lastReplied && now - lastOpened >= HOURS_24) {
    return { shouldSend: true, touchType: 'followup_opened_no_reply', variationIndex: Number(lead.outreach_count || 0) + 1 };
  }

  return { shouldSend: false, reason: 'cooldown_or_waiting' };
}

export async function sendInitialOutreach(lead, context = {}) {
  const body = await generateEmail({
    name: lead.name,
    project: lead.project || lead.projectTitle,
    track: context.track,
    matchReasoning: lead.match?.reasoning,
  });

  const subject = context.subject || generateSubjectLine(lead, context.variationIndex || 0);
  const trackingId = context.trackingId || await createTrackingId(lead.id);

  await sendEmail(lead.email, subject, body, trackingId);
  const updatedLead = await markLeadContacted(lead.id);
  if (updatedLead) {
    await updateOpportunityStage(updatedLead, 'contacted');
  }

  return { subject, body, trackingId };
}

export async function sendFollowUpOutreach(lead, context = {}) {
  const body = await generateFollowUpEmail(lead, context);
  const subject = context.subject || generateSubjectLine(lead, context.variationIndex || 1);
  const trackingId = context.trackingId || await createTrackingId(lead.id);

  await sendEmail(lead.email, subject, body, trackingId);
  const updatedLead = await markLeadContacted(lead.id);
  if (updatedLead) {
    await updateOpportunityStage(updatedLead, 'contacted');
  }

  return { subject, body, trackingId };
}

export async function runSmartOutreach(leads = []) {
  const domainCounter = new Map();
  const now = Date.now();
  const sent = [];
  const scheduled = [];

  for (const lead of leads) {
    if (sent.length >= MAX_EMAILS_PER_RUN) break;
    if (!lead.email) continue;

    const lastContacted = getTime(lead.last_contacted_at || lead.last_contacted);
    if (lastContacted && now - lastContacted < HOURS_24) {
      continue;
    }

    const domain = getDomain(lead.email);
    const alreadySentToDomain = domainCounter.get(domain) || 0;
    if (alreadySentToDomain >= MAX_EMAILS_PER_DOMAIN) {
      continue;
    }

    const nextTouch = scheduleNextTouch(lead);
    if (!nextTouch.shouldSend) {
      continue;
    }

    try {
      const context = {
        variationIndex: nextTouch.variationIndex,
        subject: generateSubjectLine(lead, nextTouch.variationIndex),
      };

      if (nextTouch.touchType === 'initial' || nextTouch.touchType === 'resend_no_open') {
        const result = await sendInitialOutreach(lead, context);
        sent.push({ leadId: lead.id, email: lead.email, touchType: nextTouch.touchType, trackingId: result.trackingId });
      } else {
        const result = await sendFollowUpOutreach(lead, context);
        sent.push({ leadId: lead.id, email: lead.email, touchType: nextTouch.touchType, trackingId: result.trackingId });
      }

      domainCounter.set(domain, alreadySentToDomain + 1);
      scheduled.push({ leadId: lead.id, nextTouch: nextTouch.touchType });
    } catch (err) {
      console.error(`❌ Error with ${lead.name || lead.id}`, err);
    }
  }

  return { sent, scheduled };
}
