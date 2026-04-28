function chooseVariation(options = []) {
  if (!options.length) return '';
  return options[Math.floor(Math.random() * options.length)];
}

function getProjectLabel(lead) {
  return lead?.project || lead?.projectTitle || 'your project';
}

function hasMicroCommitmentInputs(lead) {
  const hasTimeline = Boolean(lead?.timeline || lead?.deadline || lead?.launchDate);
  const hasUsage = Boolean(lead?.usage || lead?.channel || lead?.platform);
  const hasVibe = Boolean(lead?.vibe || lead?.style || lead?.mood);
  return hasTimeline && hasUsage && hasVibe;
}

function chooseAuthoritySignal() {
  return chooseVariation([
    `We’ve supported similar projects with fast turnaround`,
    `We typically deliver first options within 24 hours`,
    `We regularly help teams lock strong fits quickly`,
  ]);
}

function chooseScarcitySignal() {
  return chooseVariation([
    `I can prioritize a shortlist today`,
    `I have a few strong fits ready to go`,
    `I can hold top options while you review`,
  ]);
}

function chooseCta(project) {
  return chooseVariation([
    `Would you like me to send the first shortlist for ${project}?`,
    `If helpful, we can start with 2–3 focused options for ${project}.`,
    `Share your timing and I’ll send the best matches next.`,
  ]);
}

function buildStructuredResponse({ name = '', project, offer, question, insight }) {
  const cta = chooseCta(project);
  const structure = chooseVariation([
    `${offer} ${cta}`,
    `${question} ${offer}`,
    `${insight} ${cta}`,
  ]);

  return `${structure}${name ? ` ${name}` : ''}`.trim();
}

export function generateResponse(lead, classification) {
  const name = lead?.name ? `${lead.name},` : '';
  const project = getProjectLabel(lead);

  switch (classification?.intent) {
    case 'interested': {
      if (!hasMicroCommitmentInputs(lead)) {
        return chooseVariation([
          `Great to hear ${name} before I send tracks for ${project}, can you share timeline, usage, and vibe so I can match accurately?`,
          `Amazing ${name} quick one before I send options for ${project}: what’s your timeline, where will it run, and what vibe are you aiming for?`,
          `Love the interest ${name} to keep this tight for ${project}, send timeline + usage + vibe and I’ll return with best-fit tracks next.`,
        ]);
      }

      return buildStructuredResponse({
        name,
        project,
        offer: `Great to hear ${name} I can line up 2–3 best-fit tracks for ${project} with clear licensing paths. ${chooseAuthoritySignal()}. ${chooseScarcitySignal()}.`,
        question: `Quick check ${name}: ready for first options on ${project} now?`,
        insight: `For projects like ${project}, focused shortlists usually speed approvals and avoid licensing delays. ${chooseAuthoritySignal()}.`,
      });
    }

    case 'info_request':
      return buildStructuredResponse({
        name,
        project,
        offer: `Happy to share details ${name} for ${project} — ${chooseAuthoritySignal().toLowerCase()} and can map options by budget and usage. ${chooseScarcitySignal()}.`,
        question: `Could you share timeline, usage, and vibe for ${project}?`,
        insight: `The strongest music picks usually come from clear timing, placement, and creative direction.`,
      });

    case 'not_interested':
      return buildStructuredResponse({
        name,
        project,
        offer: `Understood ${name} — I’ll pause this for now. If priorities shift on ${project}, I can re-open quickly with a focused shortlist.`,
        question: `Would it help if I checked back when timing is better for ${project}?`,
        insight: `Totally fair — teams often revisit music once timeline and usage are locked.`,
      });

    default:
      return buildStructuredResponse({
        name,
        project,
        offer: `Thanks for the note ${name}. I can send concise options tailored to ${project}. ${chooseAuthoritySignal()}.`,
        question: `Want me to start with a tight shortlist for ${project}?`,
        insight: `A small first batch often makes selection faster and keeps licensing simple.`,
      });
  }
}
