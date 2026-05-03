const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = process.env.GHL_API_VERSION || '2021-07-28';

function maskToken(token = '') {
  if (!token) return 'missing';
  if (token.length < 10) return `${token.slice(0, 2)}***`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function normalizePhone(value = '') {
  const cleaned = String(value).replace(/[^\d+]/g, '');
  return cleaned || undefined;
}

function buildHeaders() {
  const token = process.env.GHL_API_KEY;
  if (!token) {
    throw new Error('Missing GHL_API_KEY environment variable');
  }

  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json'
  };
}

async function ghlRequest(path, { method = 'GET', body, context = {} } = {}) {
  const url = `${GHL_BASE_URL}${path}`;
  const headers = buildHeaders();

  const requestMeta = {
    method,
    url,
    context,
    authToken: maskToken(process.env.GHL_API_KEY),
    locationId: process.env.GHL_LOCATION_ID || 'missing',
    payload: body || null
  };

  console.log('[GHL][REQUEST]', JSON.stringify(requestMeta));

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const rawBody = await response.text();
  let parsed;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsed = { rawBody };
  }

  console.log('[GHL][RESPONSE]', JSON.stringify({
    method,
    url,
    status: response.status,
    ok: response.ok,
    response: parsed
  }));

  if (!response.ok) {
    const error = new Error(`GHL API request failed (${response.status})`);
    error.status = response.status;
    error.details = parsed;
    throw error;
  }

  return parsed;
}

function buildContactPayload(lead = {}) {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) {
    throw new Error('Missing GHL_LOCATION_ID environment variable');
  }

  const email = lead.email ? String(lead.email).trim().toLowerCase() : undefined;
  const phone = normalizePhone(lead.phone || lead.phoneNumber || lead.mobile);

  if (!email && !phone) {
    throw new Error('GHL requires at least one identifier: email or phone');
  }

  return {
    locationId,
    firstName: lead.firstName || lead.name?.split(' ')?.[0] || undefined,
    lastName: lead.lastName || lead.name?.split(' ')?.slice(1).join(' ') || undefined,
    name: lead.name || undefined,
    email,
    phone,
    tags: Array.isArray(lead.tags) ? lead.tags : ['resonova'],
    source: lead.source || 'resonova',
    customFields: Array.isArray(lead.customFields) ? lead.customFields : []
  };
}

export async function createOrUpdateContact(lead) {
  const payload = buildContactPayload(lead);
  return ghlRequest('/contacts/upsert', {
    method: 'POST',
    body: payload,
    context: { action: 'createOrUpdateContact', leadId: lead.id || null }
  });
}

export async function addContactToPipeline({ contactId, lead }) {
  const pipelineId = process.env.GHL_PIPELINE_ID;
  const stageId = process.env.GHL_PIPELINE_STAGE_ID;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!pipelineId || !stageId) {
    throw new Error('Missing GHL_PIPELINE_ID or GHL_PIPELINE_STAGE_ID environment variable');
  }

  return ghlRequest('/opportunities/upsert', {
    method: 'POST',
    body: {
      locationId,
      contactId,
      pipelineId,
      pipelineStageId: stageId,
      name: lead?.opportunityName || lead?.project || lead?.name || 'Resonova Lead',
      status: 'open',
      monetaryValue: Number(lead?.estimatedValue || 0),
      source: 'resonova'
    },
    context: { action: 'addContactToPipeline', contactId }
  });
}

export async function triggerWorkflow({ contactId, workflowId = process.env.GHL_WORKFLOW_ID }) {
  if (!workflowId) {
    console.log('[GHL][WORKFLOW] Skipping trigger because GHL_WORKFLOW_ID is not set');
    return { skipped: true, reason: 'missing_workflow_id' };
  }

  return ghlRequest(`/contacts/${contactId}/workflow/${workflowId}`, {
    method: 'POST',
    body: {},
    context: { action: 'triggerWorkflow', contactId, workflowId }
  });
}

export async function pushLeadToGhl(lead) {
  const contact = await createOrUpdateContact(lead);
  const contactId = contact?.contact?.id || contact?.id;

  if (!contactId) {
    throw new Error('GHL did not return contact id after upsert');
  }

  const opportunity = await addContactToPipeline({ contactId, lead });
  const workflow = await triggerWorkflow({ contactId });

  return { contact, opportunity, workflow, contactId };
}

export function validateWebhookSignature(req) {
  const configuredSecret = process.env.GHL_WEBHOOK_SECRET;
  if (!configuredSecret) return true;

  const received = req.headers['x-ghl-signature'] || req.headers['x-webhook-signature'];
  const isValid = received === configuredSecret;

  if (!isValid) {
    console.error('[GHL][WEBHOOK] Invalid signature', {
      received: received ? 'present' : 'missing'
    });
  }

  return isValid;
}
