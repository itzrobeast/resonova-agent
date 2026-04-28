export async function createOrUpdateContact(lead) {
  console.log(`[CRM] createOrUpdateContact -> ${lead.email || lead.name || lead.id}`);
}

export async function updateOpportunityStage(lead, stage) {
  console.log(`[CRM] updateOpportunityStage -> ${lead.email || lead.name || lead.id} => ${stage}`);
}
