import { generateEmail, generateFollowUpEmail } from './ai.js';
import { sendEmail } from './email.js';
import { markLeadContacted } from './leadStore.js';
import { updateOpportunityStage } from './crm.js';

export async function sendInitialOutreach(lead, context = {}) {
  const body = await generateEmail({
    name: lead.name,
    project: lead.project || lead.projectTitle,
    track: context.track,
    matchReasoning: lead.match?.reasoning,
  });

  await sendEmail(lead.email, 'Quick idea for your project', body);
  const updatedLead = await markLeadContacted(lead.id);
  if (updatedLead) {
    await updateOpportunityStage(updatedLead, 'contacted');
  }

  return { subject: 'Quick idea for your project', body };
}

export async function sendFollowUpOutreach(lead, context = {}) {
  const body = await generateFollowUpEmail(lead, context);
  await sendEmail(lead.email, 'Following up on music options', body);

  return { subject: 'Following up on music options', body };
}
