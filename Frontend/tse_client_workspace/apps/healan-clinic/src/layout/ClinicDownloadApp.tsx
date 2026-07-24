import React, { useEffect, useId, useRef, useState } from 'react';
import { IconChevron } from './navIcons';

/** Clinic staff PWA — Android & iOS until native APK is ready */
export const CLINIC_PWA_URL = '/mobile/';

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L11 12.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconAndroid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48 19.2 6.7a.5.5 0 0 0-.86-.5l-1.64 2.84A7.9 7.9 0 0 0 12 8c-1.7 0-3.26.53-4.7 1.44L5.66 6.2a.5.5 0 1 0-.86.5l1.6 2.78A7.96 7.96 0 0 0 4 15.5V16a2 2 0 0 0 2 2h.5v2.25a1.25 1.25 0 0 0 2.5 0V18h6v2.25a1.25 1.25 0 0 0 2.5 0V18H18a2 2 0 0 0 2-2v-.5a7.96 7.96 0 0 0-2.4-5.02ZM8.25 14.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7Zm-2-6.3c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2Z" />
    </svg>
  );
}

type Props = {
  onNavigate?: () => void;
};

/** Sidebar download block — Android & iOS both open clinic PWA */
export function ClinicDownloadApp({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div
      className={open ? 'clinic-dl is-open' : 'clinic-dl'}
      ref={rootRef}
      data-build="clinic-dl-v1"
    >
      <button
        type="button"
        className="healan-nav-item clinic-dl__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="healan-nav-item__icon">
          <IconDownload />
        </span>
        <span className="healan-nav-item__text">دانلود اپلیکیشن</span>
        <span className="clinic-dl__caret" aria-hidden>
          <IconChevron open={open} />
        </span>
      </button>

      <div id={panelId} className="clinic-dl__panel" hidden={!open}>
        <p className="clinic-dl__hint">نصب وب‌اپ کلینیک (PWA)</p>
        <a className="clinic-dl__option clinic-dl__option--android" href={CLINIC_PWA_URL} onClick={pick}>
          <span className="clinic-dl__icon" aria-hidden>
            <IconAndroid />
          </span>
          <span className="clinic-dl__text">
            <strong>اندروید</strong>
            <small>Chrome → Add to Home screen</small>
          </span>
        </a>
        <a className="clinic-dl__option clinic-dl__option--ios" href={CLINIC_PWA_URL} onClick={pick}>
          <span className="clinic-dl__icon" aria-hidden>
            <IconApple />
          </span>
          <span className="clinic-dl__text">
            <strong>iOS</strong>
            <small>Share → Add to Home Screen</small>
          </span>
        </a>
      </div>
    </div>
  );
}
