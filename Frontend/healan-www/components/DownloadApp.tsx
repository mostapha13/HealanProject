'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** Patient PWA — Android & iOS until native APK is ready */
export const PATIENT_PWA_URL = process.env.NEXT_PUBLIC_IOS_PWA_URL ?? '/mobile/';

const BUILD = 'build-v14-pwa';

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L11 12.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

function IconAndroid() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.6 9.48 19.2 6.7a.5.5 0 0 0-.86-.5l-1.64 2.84A7.9 7.9 0 0 0 12 8c-1.7 0-3.26.53-4.7 1.44L5.66 6.2a.5.5 0 1 0-.86.5l1.6 2.78A7.96 7.96 0 0 0 4 15.5V16a2 2 0 0 0 2 2h.5v2.25a1.25 1.25 0 0 0 2.5 0V18h6v2.25a1.25 1.25 0 0 0 2.5 0V18H18a2 2 0 0 0 2-2v-.5a7.96 7.96 0 0 0-2.4-5.02ZM8.25 14.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
      />
    </svg>
  );
}

function IconApple() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7Zm-2-6.3c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2Z"
      />
    </svg>
  );
}

function DownloadOptions({ onPick }: { onPick?: () => void }) {
  return (
    <>
      <a
        className="nav-dl__option nav-dl__option--android"
        href={PATIENT_PWA_URL}
        onClick={onPick}
      >
        <span className="nav-dl__icon" aria-hidden>
          <IconAndroid />
        </span>
        <span className="nav-dl__text">
          <strong>اندروید</strong>
          <small>وب‌اپ (PWA) — در Chrome روی Add to Home screen بزنید</small>
        </span>
        <span className="nav-dl__chevron" aria-hidden>
          ‹
        </span>
      </a>
      <a className="nav-dl__option nav-dl__option--ios" href={PATIENT_PWA_URL} onClick={onPick}>
        <span className="nav-dl__icon" aria-hidden>
          <IconApple />
        </span>
        <span className="nav-dl__text">
          <strong>iOS</strong>
          <small>وب‌اپ (PWA) — Share → Add to Home Screen</small>
        </span>
        <span className="nav-dl__chevron" aria-hidden>
          ‹
        </span>
      </a>
    </>
  );
}

/** Desktop nav dropdown — only in menu, not a separate header CTA */
export function NavDownloadMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      className={open ? 'nav-dl nav-dl--desktop is-open' : 'nav-dl nav-dl--desktop'}
      ref={rootRef}
      data-build={BUILD}
    >
      <button
        type="button"
        className="nav-dl__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-dl__trigger-icon" aria-hidden>
          <IconDownload />
        </span>
        دانلود اپلیکیشن
        <span className="nav-dl__caret" aria-hidden />
      </button>
      <div id={menuId} className="nav-dl__panel" hidden={!open} role="menu">
        <p className="nav-dl__panel-title">نصب وب‌اپ بیمار</p>
        <DownloadOptions onPick={() => setOpen(false)} />
      </div>
    </div>
  );
}

/** Mobile drawer block with Android / iOS options */
export function DrawerDownloadLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="nav-dl nav-dl--drawer" data-build={BUILD}>
      <div className="nav-dl__drawer-head">
        <span className="nav-dl__trigger-icon" aria-hidden>
          <IconDownload />
        </span>
        <p className="nav-dl__label">دانلود اپلیکیشن</p>
      </div>
      <div className="nav-dl__stack">
        <DownloadOptions onPick={onNavigate} />
      </div>
    </div>
  );
}
