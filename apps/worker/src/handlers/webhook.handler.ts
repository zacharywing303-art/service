export async function handleWebhookDeliver(data: { url: string; event: string; payload: Record<string, unknown> }) {
  console.log(`Delivering webhook ${data.event} to ${data.url}`);
  const response = await fetch(data.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-OpenFSM-Event': data.event },
    body: JSON.stringify(data.payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
  console.log(`Webhook ${data.event} delivered`);
}
