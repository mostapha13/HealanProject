const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6128';

export async function registerDocument(input: { organizationId: string; title: string; documentType: string; fileId: string; ownerUserId?: string }) {
  const response = await fetch(`${API_BASE}/api/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error('ثبت سند انجام نشد');
  return response.json();
}
