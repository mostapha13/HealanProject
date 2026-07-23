'use client';

import { useEffect, useState } from 'react';
import {
  THEMES,
  applyTheme,
  readStoredTheme,
  type ThemeId,
} from '@/lib/theme';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>('classic');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const select = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-switcher__btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        تم
      </button>
      {open ? (
        <ul className="theme-switcher__menu" role="listbox" aria-label="انتخاب تم">
          {THEMES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={theme === item.id}
                className={
                  theme === item.id
                    ? 'theme-switcher__option is-active'
                    : 'theme-switcher__option'
                }
                onClick={() => select(item.id)}
              >
                <span className="theme-switcher__swatches" aria-hidden>
                  {item.swatch.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
