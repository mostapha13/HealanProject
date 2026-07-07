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
}

export function uploadFile(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return request.upload({
    baseUrl: FILE_API_URL,
    url: 'Upload',
    formData,
  }) as Promise<UploadFileResponse>;
}

export function getFileDownloadUrl(fileId: string): string {
  return `${FILE_API_URL}Download/${fileId}`;
}
