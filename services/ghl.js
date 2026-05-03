const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2023-02-21';

function getToken() {
  const token = process.env.GHL_ACCESS_TOKEN || process.env.GHL_API_KEY;
  if (!token) throw new Error('Missing GHL_ACCESS_TOKEN');
  return token;
}

async function ghlRequest(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: API_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log('[GHL]', method, path, res.status, data);

  if (!res.ok) {
    const err = new Error(`GHL error ${res.status}`);
    err.details = data;
    throw err;
  }

  return data;
}

export async function createOrUpdateContact(lead) {
  return ghlRequest('/contacts/upsert', {
    method: 'POST',
    body: {
      locationId: process.env.GHL_LOCATION_ID,
      email: lead.email?.toLowerCase(),
      phone: lead.phone,
      firstName: lead.firstName || lead.name?.split(' ')[0],
      lastName: lead.lastName || ''
    }
  });
}

export async function pushLeadToGhl(lead) {
  const contact = await createOrUpdateContact(lead);
  const contactId = contact?.contact?.id || contact?.id;

  if (!contactId) throw new Error('No contact ID returned');

  const opportunity = await ghlRequest('/opportunities/upsert', {
    method: 'POST',
    body: {
      locationId: process.env.GHL_LOCATION_ID,
      contactId,
      pipelineId: process.env.GHL_PIPELINE_ID,
      pipelineStageId: process.env.GHL_PIPELINE_STAGE_ID,
      name: 'Resonova Lead'
    }
  });

  if (process.env.GHL_WORKFLOW_ID) {
    await ghlRequest(`/contacts/${contactId}/workflow/${process.env.GHL_WORKFLOW_ID}`, {
      method: 'POST'
    });
  }

  return { contactId, opportunityId: opportunity?.id };
}

export function validateWebhookSignature() {
  return true;
}
