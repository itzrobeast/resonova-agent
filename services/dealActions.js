export function sendTrackSelection(lead) {
  console.log('🎵 Sending track selection to lead', {
    leadId: lead?.id,
    email: lead?.email,
    name: lead?.name,
  });
}
