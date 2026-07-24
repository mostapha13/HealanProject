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
  const nested = res.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    res = nested as Record<string, unknown>;
  }
  return res;
}

export function fileDownloadUrl(fileId: string): string {
  return `${config.fileApiUrl}/Download/${fileId}`;
}

/** آپلود تصویر از URI (expo-image-picker) به FileManager */
export async function uploadImageFromUri(
  getToken: TokenGetter,
  uri: string,
  fileName = 'cover.jpg'
): Promise<UploadedFileMeta> {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${config.fileApiUrl}/Upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`آپلود تصویر ناموفق بود (${res.status})`);
  }
  const data = unwrap(json);
  const fileId = pickString(data, 'fileId', 'FileId');
  if (!fileId) throw new Error('شناسه فایل از سرور دریافت نشد');
  const link = pickString(data, 'link', 'Link') || fileDownloadUrl(fileId);
  return {
    fileId,
    fileName: pickString(data, 'fileName', 'FileName') || fileName,
    link,
  };
}
