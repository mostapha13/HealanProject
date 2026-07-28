const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6129';

export async function registerDocument(input: { title: string; documentType: string; fileId: string; confidentialityLevel?: number }) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('negareshai.access_token') : null;
  const response = await fetch(`${API_BASE}/api/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error('ثبت سند انجام نشد');
  return response.json();
}

export function uploadDocument(input: { file: File; title?: string; documentType?: string; confidentialityLevel?: number }, onProgress?: (percent: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('negareshai.access_token') : null;
    const form = new FormData();
    form.append('file', input.file);
    if (input.title) form.append('title', input.title);
    form.append('documentType', input.documentType ?? 'contract');
    if (input.confidentialityLevel) form.append('confidentialityLevel', String(input.confidentialityLevel));
    const xhr = new XMLHttpRequest(); xhr.open('POST', `${API_BASE}/api/documents/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error while uploading document'));
    xhr.send(form);
  });
}

export function setAccessToken(token: string) { window.localStorage.setItem('negareshai.access_token', token); }
export function clearAccessToken() { window.localStorage.removeItem('negareshai.access_token'); }
