import { findLeads } from './leadFinder.js';
import { matchProjectToMusic } from './projectMatcher.js';
import { scoreLead } from './leadScoring.js';
import { upsertLead, getAllLeads } from './leadStore.js';
import { runSmartOutreach } from './outreach.js';
import { getTrackingStats } from './tracking.js';

export const runAgent = async () => {
  console.log('🚀 Resonova Agent Running...');

  // 1) fetch leads
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

  const leads = await getAllLeads();

  // 4) filter (not replied/closed) + sort by score DESC
  const queue = leads
    .filter((lead) => lead.status !== 'replied' && lead.status !== 'closed')
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // 5) run outreach (limits enforced in runSmartOutreach)
  const outreachResult = await runSmartOutreach(queue);

  // 6) schedule next touches + logs
  const trackingStats = await getTrackingStats();

  console.log(`📬 Emails sent: ${outreachResult.sent.length}`);
  console.log(`👀 Opens detected: ${trackingStats.opened}`);
  console.log(`🗓️ Follow-ups scheduled: ${outreachResult.scheduled.length}`);
  console.log(`🏁 Agent run complete. Processed: ${storedLeads.length}, Emails sent: ${outreachResult.sent.length}`);
};
