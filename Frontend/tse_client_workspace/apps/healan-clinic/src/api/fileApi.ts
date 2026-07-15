import { request } from '@tse/tools';
import { FILE_API_URL } from '../constants';

export interface UploadFileResponse {
  link: string;
  fileName: string;
  fileId: string;
  fileType: string;
}

export interface FileUploadMeta {
  fileId: string;
  fileName: string;
  link?: string;
  fileType?: string;
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function normalizeFileType(raw: unknown): string {
  if (raw === undefined || raw === null) return '';
  const value = String(raw).trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower === 'image' || lower === '1') return 'image';
  return lower;
}

export function normalizeUploadResponse(raw: unknown): UploadFileResponse {
  let res = (raw ?? {}) as Record<string, unknown>;
  const nested = res['data'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    res = nested as Record<string, unknown>;
  }

  const fileId = pickString(res, 'fileId', 'FileId');
  const rawLink = pickString(res, 'link', 'Link');
  const link = publicFileDownloadUrl(fileId, rawLink) || (fileId ? getFileDownloadUrl(fileId) : '');
  const fileType = normalizeFileType(res['fileType'] ?? res['FileType']);

  return {
    fileId,
    fileName: pickString(res, 'fileName', 'FileName') || 'فایل',
    link,
    fileType,
  };
}

export function uploadFile(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .upload({
      baseUrl: FILE_API_URL,
      url: 'Upload',
      formData,
    })
    .then((raw) => normalizeUploadResponse(raw));
}

export function getFileDownloadUrl(fileId: string): string {
  return `${FILE_API_URL}Download/${fileId}`;
}

/** Prefer relative /File/Download when API returns docker/internal hostnames. */
export function publicFileDownloadUrl(fileId: string, link?: string | null): string {
  if (!fileId) return link || '';
  if (!link) return getFileDownloadUrl(fileId);
  try {
    const host = new URL(link, window.location.origin).hostname.toLowerCase();
    if (
      host === 'filemanager-webui' ||
      host.endsWith('.local') ||
      host === 'localhost' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host)
    ) {
      return getFileDownloadUrl(fileId);
    }
  } catch {
    return getFileDownloadUrl(fileId);
  }
  return link;
}
