import { Platform } from 'react-native';
import { config } from '../config';
import type { TokenGetter } from './client';

export type UploadedFileMeta = {
  fileId: string;
  fileName: string;
  link: string;
};

function pickString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function unwrap(raw: unknown): Record<string, unknown> {
  let res = (raw ?? {}) as Record<string, unknown>;
  const nested = res.data ?? res.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    res = nested as Record<string, unknown>;
  }
  return res;
}

export function fileDownloadUrl(fileId: string): string {
  return `${config.fileApiUrl}/Download/${fileId}`;
}

function guessNameFromUri(uri: string, fallback: string): string {
  try {
    const path = uri.split('?')[0] || '';
    const last = path.split('/').pop() || '';
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return last;
  } catch {
    /* ignore */
  }
  return fallback;
}

async function appendFileToFormData(
  formData: FormData,
  uri: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  // On web, { uri, name, type } is not a real File/Blob and FileManager rejects/500s.
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) throw new Error('خواندن فایل از مرورگر ناموفق بود');
    const blob = await res.blob();
    if (!blob || blob.size === 0) throw new Error('فایل خالی است');
    const type = blob.type || mimeType;
    const name = fileName || guessNameFromUri(uri, 'upload.jpg');
    // Prefer File so ASP.NET binds IFormFile.FileName correctly
    const payload =
      typeof File !== 'undefined' ? new File([blob], name, { type }) : blob;
    formData.append('file', payload);
    return;
  }
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
}

function formatUploadFailure(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const title = o.title ?? o.Title ?? o.detail ?? o.Detail ?? o.message;
    if (typeof title === 'string' && title.trim()) return title;
  }
  if (status === 0) {
    return 'آپلود بلاک شد (احتمالاً CORS). سرویس File را برای localhost به‌روز کنید.';
  }
  if (status === 401 || status === 403) return 'نشست برای آپلود فایل معتبر نیست. دوباره وارد شوید.';
  return `آپلود تصویر ناموفق بود (${status})`;
}

/** آپلود تصویر از URI (expo-image-picker) به FileManager */
export async function uploadImageFromUri(
  getToken: TokenGetter,
  uri: string,
  fileName = 'cover.jpg'
): Promise<UploadedFileMeta> {
  const token = await getToken();
  const formData = new FormData();
  const name = guessNameFromUri(uri, fileName);
  await appendFileToFormData(formData, uri, name, 'image/jpeg');

  let res: Response;
  try {
    res = await fetch(`${config.fileApiUrl}/Upload`, {
      method: 'POST',
      // Do NOT set Content-Type — browser must add multipart boundary.
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
  } catch {
    throw new Error(formatUploadFailure(0, null));
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatUploadFailure(res.status, json));
  }
  const data = unwrap(json);
  const fileId = pickString(data, 'fileId', 'FileId');
  if (!fileId) throw new Error('شناسه فایل از سرور دریافت نشد');
  const link = pickString(data, 'link', 'Link') || fileDownloadUrl(fileId);
  return {
    fileId,
    fileName: pickString(data, 'fileName', 'FileName') || name,
    link,
  };
}
