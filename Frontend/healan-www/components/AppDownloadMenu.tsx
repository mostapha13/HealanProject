'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** APK served from Next `public/downloads/` (override via env when CDN/EAS URL exists). */
export const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL ?? '/downloads/healan-patient.apk';

/** Patient Expo PWA on www.drshahrooei.ir */
export const IOS_PWA_URL = process.env.NEXT_PUBLIC_IOS_PWA_URL ?? '/mobile/';

function IconAndroid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.6 9.48 19.2 6.7a.5.5 0 0 0-.86-.5l-1.64 2.84A7.9 7.9 0 0 0 12 8c-1.7 0-3.26.53-4.7 1.44L5.66 6.2a.5.5 0 1 0-.86.5l1.6 2.78A7.96 7.96 0 0 0 4 15.5V16a2 2 0 0 0 2 2h.5v2.25a1.25 1.25 0 0 0 2.5 0V18h6v2.25a1.25 1.25 0 0 0 2.5 0V18H18a2 2 0 0 0 2-2v-.5a7.96 7.96 0 0 0-2.4-5.02ZM8.25 14.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
      />
    </svg>
  );
}

function IconApple({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7Zm-2-6.3c.6-.7 1-1.7.9-2.7-0.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2Z"
      />
    </svg>
  );
}

type Props = {
  /** Compact trigger for desktop nav */
  variant?: 'nav' | 'drawer' | 'footer';
  onNavigate?: () => void;
};

export function AppDownloadMenu({ variant = 'nav', onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open || variant === 'drawer') return undefined;
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
  }, [open, variant]);

  const options = (
    <>
      <a
        className="app-dl__option app-dl__option--android"
        href={ANDROID_APK_URL}
        download="healan-patient.apk"
        onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <span className="app-dl__icon" aria-hidden>
          <IconAndroid />
        </span>
        <span className="app-dl__copy">
          <strong>دانلود برای اندروید</strong>
          <small>فایل APK نصب مستقیم</small>
        </span>
      </a>
      <a
        className="app-dl__option app-dl__option--ios"
        href={IOS_PWA_URL}
        onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <span className="app-dl__icon" aria-hidden>
          <IconApple />
        </span>
        <span className="app-dl__copy">
          <strong>دانلود برای iOS</strong>
          <small>نسخه PWA — نصب از سافاری</small>
        </span>
      </a>
    </>
  );

  if (variant === 'drawer' || variant === 'footer') {
    return (
      <div className={`app-dl app-dl--${variant}`}>
        <p className="app-dl__label">دانلود اپلیکیشن</p>
        <div className="app-dl__stack">{options}</div>
      </div>
    );
  }

  return (
    <div
      className={open ? 'app-dl app-dl--nav is-open' : 'app-dl app-dl--nav'}
      ref={rootRef}
    >
      <button
        type="button"
        className="app-dl__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        دانلود اپلیکیشن
        <span className="app-dl__caret" aria-hidden />
      </button>
      <div id={menuId} className="app-dl__panel" hidden={!open} role="menu">
        {options}
      </div>
    </div>
  );
}
