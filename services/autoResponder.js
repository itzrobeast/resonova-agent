function chooseVariation(options = []) {
  if (!options.length) return '';
  return options[Math.floor(Math.random() * options.length)];
}

function getProjectLabel(lead) {
  return lead?.project || lead?.projectTitle || 'your project';
}

export function generateResponse(lead, classification) {
  const name = lead?.name ? ` ${lead.name}` : '';
  const project = getProjectLabel(lead);

  switch (classification?.intent) {
    case 'interested':
      return chooseVariation([
        `Great to hear${name} — thanks for the reply. I can send 2–3 tracks tailored to ${project} with broadcast vs digital licensing options. Want me to send that shortlist today?`,
        `Amazing${name}. For ${project}, I can line up a focused 2–3 track shortlist plus quick licensing paths. Should I send first options now so you can review immediately?`,
        `Love the interest${name}. I’ll prep 2–3 best-fit tracks for ${project} and include rights-ready options to keep momentum. Can you share your deadline so I prioritize the right cuts?`,
      ]);
    case 'info_request':
      return chooseVariation([
        `Happy to share details${name}. What’s the timeline + usage for ${project} (TV, film, ad, or digital)? I’ll match tracks accordingly.`,
        `Absolutely${name} — I can tailor options for ${project} fast. Could you share launch timing and where the music will run so I can send the right licensing/rate range?`,
        `Thanks${name}. For ${project}, I can map recommendations by budget and usage. Mind sharing timeline and channel so I can send the most relevant picks next?`,
      ]);
    case 'not_interested':
      return chooseVariation([
        `Thanks for letting me know${name} — understood. If priorities shift on ${project}, just say “reopen” and I can send a quick shortlist.`,
        `Appreciate the update${name}. I’ll close this thread for now; if ${project} needs music support later, reply anytime and I can turn options around quickly.`,
        `Totally fair${name}. I’ll pause outreach on ${project}. If timing changes, would you like me to check back next month?`,
      ]);
    default:
      return chooseVariation([
        `Thanks for the note${name}. If useful, I can send concise options tailored to ${project}. Want me to share a first shortlist?`,
        `Appreciate the update${name}. I can quickly propose a few fits for ${project} plus licensing paths—should I send that over?`,
        `Got it${name}. If you share your timeline for ${project}, I can return with targeted track options right away.`,
      ]);
  }
}
