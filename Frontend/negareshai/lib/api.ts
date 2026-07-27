const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6128';

export async function registerDocument(input: { organizationId: string; title: string; documentType: string; fileId: string; ownerUserId?: string }) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('negareshai.access_token') : null;
  const response = await fetch(`${API_BASE}/api/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error('ثبت سند انجام نشد');
  return response.json();
}

export function setAccessToken(token: string) { window.localStorage.setItem('negareshai.access_token', token); }
export function clearAccessToken() { window.localStorage.removeItem('negareshai.access_token'); }
