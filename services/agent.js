import { findLeads } from './leadFinder.js';
import { matchProjectToMusic } from './projectMatcher.js';
import { scoreLead } from './leadScoring.js';
import { upsertLead, getLeadsForFollowUp } from './leadStore.js';
import { sendInitialOutreach } from './outreach.js';

const MAX_EMAILS_PER_RUN = 20;
const MIN_HOURS_SINCE_CONTACT = 48;

export const runAgent = async () => {
  console.log('🚀 Resonova Agent Running...');

  // 1) find leads
  const discoveredLeads = await findLeads();
  console.log(`🔎 Found ${discoveredLeads.length} leads.`);

  // 2) score + 3) store leads
  const storedLeads = [];
  for (const rawLead of discoveredLeads) {
    const match = matchProjectToMusic({
      title: rawLead.project || rawLead.projectTitle,
      description: rawLead.notes,
      genre: rawLead.genre,
    });

    const leadWithMatch = {
      ...rawLead,
      match,
      matchScore: match.score,
    };

    const score = scoreLead(leadWithMatch);
    const stored = await upsertLead({ ...leadWithMatch, score });
    storedLeads.push(stored);
  }

  const topScores = storedLeads.map((lead) => lead.score || 0).sort((a, b) => b - a).slice(0, 5);
  console.log(`📈 Top scores this run: ${topScores.join(', ') || 'n/a'}`);

  // 4) select top leads (prioritized queue + cooling window)
  const queue = await getLeadsForFollowUp({
    max: MAX_EMAILS_PER_RUN,
    minHoursSinceContact: MIN_HOURS_SINCE_CONTACT,
  });

  // 5) send outreach
  let sentCount = 0;
  for (const lead of queue) {
    if (!lead.email) continue;

    try {
      await sendInitialOutreach(lead);
      sentCount += 1;
      console.log(`✅ Sent to ${lead.name || lead.email}`);
    } catch (err) {
      console.error(`❌ Error with ${lead.name || lead.id}`, err);
    }
  }

  // 6) schedule follow-ups (placeholder: queue already managed in leadStore)
  console.log(`🗓️ Follow-up queue size considered: ${queue.length}`);

  console.log(`🏁 Agent run complete. Processed: ${storedLeads.length}, Emails sent: ${sentCount}`);
};
