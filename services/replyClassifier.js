import OpenAI from 'openai';

const VALID_INTENTS = new Set(['interested', 'not_interested', 'info_request', 'other']);

function normalizeResult(raw = {}) {
  const intent = VALID_INTENTS.has(raw.intent) ? raw.intent : 'other';
  const confidence = Math.max(0, Math.min(1, Number(raw.confidence) || 0));
  const suggested_action = typeof raw.suggested_action === 'string' && raw.suggested_action.trim()
    ? raw.suggested_action.trim()
    : 'review_manually';

  return { intent, confidence, suggested_action };
}

function classifyByRules(message = '') {
  const text = String(message || '').toLowerCase();

  if (!text.trim()) {
    return { intent: 'other', confidence: 0.2, suggested_action: 'review_manually' };
  }

  const hasInterested = /\b(interested|sounds good|let'?s talk|love to|yes|available|send (me )?(tracks|music))\b/.test(text);
  const hasNotInterested = /\b(not interested|no thanks|remove me|stop|unsubscribe|pass|not a fit)\b/.test(text);
  const hasInfoRequest = /\b(can you|could you|what|which|how|pricing|rate|budget|details|more info|examples|catalog|rights|license)\b/.test(text) || text.includes('?');

  if (hasNotInterested) {
    return { intent: 'not_interested', confidence: 0.9, suggested_action: 'close_politely' };
  }

  if (hasInterested) {
    return { intent: 'interested', confidence: hasInfoRequest ? 0.72 : 0.86, suggested_action: 'send_tracks' };
  }

  if (hasInfoRequest) {
    return { intent: 'info_request', confidence: 0.78, suggested_action: 'send_details' };
  }

  return { intent: 'other', confidence: 0.45, suggested_action: 'review_manually' };
}

async function classifyByAI(message) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_CLASSIFIER_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Classify outreach replies into: interested, not_interested, info_request, other. Return strict JSON with keys intent, confidence (0..1), suggested_action.',
      },
      { role: 'user', content: message },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content || '{}';
  return normalizeResult(JSON.parse(content));
}

export async function classifyReply(message) {
  if (!process.env.OPENAI_API_KEY) {
    return classifyByRules(message);
  }

  try {
    return await classifyByAI(message);
  } catch (err) {
    console.warn('⚠️ classifyReply AI fallback triggered:', err.message);
    return classifyByRules(message);
  }
}
