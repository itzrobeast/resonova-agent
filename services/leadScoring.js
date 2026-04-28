const PROJECT_TYPE_WEIGHTS = {
  film: 28,
  tv: 25,
  commercial: 18,
  indie: 12,
  unknown: 8,
};

const COMPANY_TIER_WEIGHTS = {
  netflix: 30,
  hbo: 28,
  disney: 27,
  amazon: 26,
  apple: 26,
  indie: 14,
  unknown: 10,
};

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function inferProjectType(lead) {
  const type = normalizeToken(lead.projectType || lead.type);
  if (PROJECT_TYPE_WEIGHTS[type]) return type;

  const haystack = normalizeToken(`${lead.project || ''} ${lead.projectTitle || ''}`);
  if (haystack.includes('season') || haystack.includes('series') || haystack.includes('episode')) return 'tv';
  if (haystack.includes('commercial') || haystack.includes('campaign') || haystack.includes('brand')) return 'commercial';
  if (haystack.includes('indie')) return 'indie';
  if (haystack.includes('film') || haystack.includes('movie') || haystack.includes('feature')) return 'film';

  return 'unknown';
}

function inferCompanyTier(lead) {
  const company = normalizeToken(lead.company || lead.studio || lead.network);
  if (!company) return 'unknown';

  for (const tier of Object.keys(COMPANY_TIER_WEIGHTS)) {
    if (tier !== 'unknown' && company.includes(tier)) {
      return tier;
    }
  }

  if (company.includes('indie') || company.includes('independent')) return 'indie';
  return 'unknown';
}

function recencyScore(projectDate) {
  if (!projectDate) return 8;

  const date = new Date(projectDate);
  if (Number.isNaN(date.getTime())) return 8;

  const now = Date.now();
  const ageDays = Math.max(0, Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24)));

  if (ageDays <= 30) return 25;
  if (ageDays <= 90) return 20;
  if (ageDays <= 180) return 14;
  if (ageDays <= 365) return 10;
  return 5;
}

function keywordMatchScore(matchScore) {
  const numeric = Number(matchScore);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(17, Math.round(numeric * 0.17)));
}

export function scoreLead(lead = {}) {
  const projectType = inferProjectType(lead);
  const companyTier = inferCompanyTier(lead);

  const total =
    (PROJECT_TYPE_WEIGHTS[projectType] || PROJECT_TYPE_WEIGHTS.unknown) +
    (COMPANY_TIER_WEIGHTS[companyTier] || COMPANY_TIER_WEIGHTS.unknown) +
    recencyScore(lead.projectDate || lead.releaseDate || lead.lastUpdatedAt) +
    keywordMatchScore(lead.match?.score ?? lead.matchScore);

  return Math.max(0, Math.min(100, total));
}
