export function generateResponse(lead, classification) {
  const name = lead?.name ? ` ${lead.name}` : '';

  switch (classification?.intent) {
    case 'interested':
      return `Great to hear${name} — thanks for the reply. I can send over 2–3 tracks that fit ${lead.project || 'your project'} and include quick licensing options. Any preferred vibe or reference tracks?`;
    case 'info_request':
      return `Happy to share details${name}. I can send catalog options, turnaround timing, and licensing/rate ranges based on your project scope. If you share timeline + usage, I’ll tailor recommendations.`;
    case 'not_interested':
      return `Thanks for letting me know${name} — totally understood. I appreciate your time and will close this thread. Wishing you a smooth production.`;
    default:
      return `Thanks for the note${name}. Appreciate the update — if helpful, I can share a concise set of options tailored to your project.`;
  }
}
