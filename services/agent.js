import { findLeads } from './leadFinder.js';
import { generateOutreach } from './ai.js';
import { sendEmail } from './email.js';

export const runAgent = async () => {
  console.log("🚀 Resonova Agent Running...");

  // Step 1: Find leads
  const leads = await findLeads();

  for (const lead of leads) {
    try {
      console.log(`🔍 Processing: ${lead.name}`);

      // Step 2: Generate personalized outreach
      const message = await generateOutreach(lead);

      // Step 3: Send email
      await sendEmail({
        to: lead.email,
        subject: message.subject,
        body: message.body,
      });

      console.log(`✅ Sent to ${lead.name}`);

    } catch (err) {
      console.error(`❌ Error with ${lead.name}`, err);
    }
  }

  console.log("🏁 Agent run complete.");
};
