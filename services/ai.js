import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function complete(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content || '';
}

export function generateSubjectLine(lead, variationIndex = 0) {
  const project = lead.project || lead.projectTitle || 'your project';
  const company = lead.company || lead.name || 'your team';
  const variants = [
    `Quick thought for ${project}`,
    `Music fit idea for ${company}`,
    `Soft intro — possible track for ${project}`,
  ];

  return variants[variationIndex % variants.length];
}

export async function generateEmail({ name, project, track, matchReasoning }) {
  const prompt = `
Write a short email to a music supervisor.

Name: ${name}
Project: ${project}
Track: ${track || 'N/A'}
Project/music fit: ${matchReasoning || 'General fit, no specific reasoning available.'}

Keep it:
- under 80 words
- casual
- confident
- not salesy
`;

  return complete(prompt);
}

export async function generateFollowUpEmail(lead, context = {}) {
  const shortDirect = lead.status === 'replied'
    ? 'Use a shorter, direct style (<= 45 words).'
    : 'Keep a concise but warm style (<= 70 words).';

  const prompt = `
Write a follow-up email.

Lead name: ${lead.name}
Project: ${lead.project || lead.projectTitle || 'N/A'}
Prior context: ${context.previousMessage || 'Initial outreach sent previously.'}
Project/music fit reasoning: ${lead.match?.reasoning || context.matchReasoning || 'No specific reasoning available.'}
Tone guidance: ${shortDirect}

Do not sound pushy. Include one clear CTA.
`;

  return complete(prompt);
}

// Backwards-compatible helper used by older agent flow.
export async function generateOutreach(lead) {
  return {
    subject: 'Quick idea for your project',
    body: await generateEmail({
      name: lead.name,
      project: lead.project || lead.projectTitle,
      track: lead.track,
      matchReasoning: lead.match?.reasoning,
    }),
  };
}
