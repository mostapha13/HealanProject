import React, { useRef, useState } from 'react';
import { uploadFile, getFileDownloadUrl, type FileUploadMeta } from '../api/fileApi';

export type { FileUploadMeta };

interface HealanFileUploadProps {
  value: FileUploadMeta | null;
  onChange: (meta: FileUploadMeta | null) => void;
  onError?: (err: unknown) => void;
  accept?: string;
  label?: string;
}

export function HealanFileUpload({
  value,
  onChange,
  onError,
  accept = '.jpg,.jpeg,.png,.bmp,.pdf',
  label = 'پیوست تصویر',
}: HealanFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      onChange({
        fileId: res.fileId,
        fileName: res.fileName,
        link: res.link || getFileDownloadUrl(res.fileId),
      });
    } catch (err) {
      onError?.(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadUrl = value?.link ?? (value?.fileId ? getFileDownloadUrl(value.fileId) : null);

  return (
    <div className="healan-file-upload">
      <span className="healan-file-upload__label">{label}</span>
      {value?.fileId ? (
        <div className="healan-file-upload__attached">
          {downloadUrl ? (
            <a href={downloadUrl} target="_blank" rel="noreferrer" className="healan-file-upload__name">
              {value.fileName || 'مشاهده فایل'}
            </a>
          ) : (
            <span className="healan-file-upload__name">{value.fileName}</span>
          )}
          <button
            type="button"
            className="healan-btn healan-btn--outline healan-btn--sm"
            onClick={() => onChange(null)}
          >
            حذف
          </button>
        </div>
      ) : (
        <div className="healan-file-upload__actions">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="healan-file-upload__input"
            disabled={uploading}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {uploading && <span className="healan-file-upload__status">در حال آپلود...</span>}
        </div>
      )}
    </div>
  );
}
