const DEFAULT_KEYWORDS = [
  'cinematic',
  'trailer',
  'ambient',
  'indie',
  'electronic',
  'orchestral',
  'drama',
  'uplifting',
  'dark',
];

function toText(value) {
  return String(value || '').toLowerCase();
}

export function matchProjectToMusic(project = {}, catalogKeywords = DEFAULT_KEYWORDS) {
  const source = toText(`${project.title || project.project || ''} ${project.description || ''} ${project.genre || ''}`);
  const normalizedKeywords = (catalogKeywords || []).map((k) => toText(k)).filter(Boolean);

  const matchedKeywords = normalizedKeywords.filter((keyword) => source.includes(keyword));

  const rawScore = normalizedKeywords.length
    ? Math.round((matchedKeywords.length / normalizedKeywords.length) * 100)
    : 0;

  const score = Math.max(0, Math.min(100, rawScore));

  const reasoning = matchedKeywords.length
    ? `Matched ${matchedKeywords.length} keyword(s): ${matchedKeywords.join(', ')}.`
    : 'No direct keyword overlap found; use a general discovery pitch.';

  return {
    score,
    matchedKeywords,
    reasoning,
  };
}
