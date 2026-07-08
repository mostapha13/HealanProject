import { environment } from '../environments/environment';
import type { PortalContentItem } from './portalApi';

export function getFileDownloadUrl(fileId: string): string {
  return `${environment.fileApiUrl}Download/${fileId}`;
}

export function resolvePortalImageUrl(item: Pick<PortalContentItem, 'imageUrl' | 'imageFileId'>): string {
  if (item.imageUrl?.trim()) return item.imageUrl.trim();
  if (item.imageFileId?.trim()) return getFileDownloadUrl(item.imageFileId.trim());
  return '';
}
