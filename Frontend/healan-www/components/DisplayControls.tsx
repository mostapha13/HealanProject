'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  THEMES,
  applyFontScale,
  applyNight,
  applyTheme,
  readStoredNight,
  readStoredTheme,
  type ThemeId,
} from '@/lib/theme';

/**
 * Accessibility / appearance dock — bottom-start (away from assistant FAB).
 * Theme + night persist; font size is session-only.
 */
export function DisplayControls() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('classic');
  const [night, setNight] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(readStoredTheme());
    setNight(readStoredNight());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selectTheme = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
  };

  const toggleNight = () => {
    const next = !night;
    setNight(next);
    applyNight(next);
  };

  const bumpFont = (delta: number) => {
    setFontScale((prev) => {
      const next = applyFontScale(prev + delta) ?? prev;
      return next;
    });
  };

  return (
    <div className="display-dock" ref={panelRef}>
      {open ? (
        <div className="display-dock__panel" role="dialog" aria-label="تنظیمات نمایش">
          <div className="display-dock__section">
            <span className="display-dock__label">تم سایت</span>
            <div className="display-dock__themes" role="listbox" aria-label="انتخاب تم">
              {THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={theme === item.id}
                  className={
                    theme === item.id
                      ? 'display-dock__theme is-active'
                      : 'display-dock__theme'
                  }
                  onClick={() => selectTheme(item.id)}
                  title={item.label}
                >
                  <span className="display-dock__swatches" aria-hidden>
                    {item.swatch.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="display-dock__section display-dock__row">
            <button
              type="button"
              className={night ? 'display-dock__chip is-active' : 'display-dock__chip'}
              onClick={toggleNight}
              aria-pressed={night}
            >
              <NightIcon />
              {night ? 'حالت روز' : 'حالت شب'}
            </button>
          </div>

          <div className="display-dock__section">
            <span className="display-dock__label">اندازه متن (فقط این نشست)</span>
            <div className="display-dock__font">
              <button
                type="button"
                className="display-dock__font-btn"
                aria-label="کوچک‌تر کردن فونت"
                disabled={fontScale <= FONT_SCALE_MIN}
                onClick={() => bumpFont(-FONT_SCALE_STEP)}
              >
                الف−
              </button>
              <span className="display-dock__font-value">
                {Math.round(fontScale * 100)}٪
              </span>
              <button
                type="button"
                className="display-dock__font-btn"
                aria-label="بزرگ‌تر کردن فونت"
                disabled={fontScale >= FONT_SCALE_MAX}
                onClick={() => bumpFont(FONT_SCALE_STEP)}
              >
                الف+
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="display-dock__toggle"
        aria-expanded={open}
        aria-label="تنظیمات نمایش، تم و فونت"
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon />
      </button>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
