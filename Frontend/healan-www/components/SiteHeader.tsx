'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookingCta, PatientCta } from './CtaLinks';

type Props = {
  brandName: string;
  specialty: string;
  phone: string;
  phoneDisplay: string;
  topbar: string;
};

type NavItem = {
  href: string;
  label: string;
  kind: 'anchor' | 'next' | 'spa';
};

const NAV_LINKS: NavItem[] = [
  { href: '/#about', label: 'درباره پزشک', kind: 'anchor' },
  { href: '/#services', label: 'خدمات', kind: 'anchor' },
  { href: '/#reviews', label: 'نظرات', kind: 'anchor' },
  { href: '/#contact', label: 'تماس', kind: 'anchor' },
  { href: '/blog', label: 'بلاگ', kind: 'next' },
  { href: '/assistant', label: 'دستیار', kind: 'spa' },
];

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  if (item.kind === 'next') {
    return (
      <Link href={item.href} onClick={onNavigate}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} onClick={onNavigate}>
      {item.label}
    </a>
  );
}

export function SiteHeader({
  brandName,
  specialty,
  phone,
  phoneDisplay,
  topbar,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span className="topbar__text">{topbar}</span>
          <a href={`tel:${phone}`} className="topbar__phone">
            {phoneDisplay}
          </a>
        </div>
      </div>
      <header className="header">
        <div className="container header__inner">
          <Link href="/" className="brand" onClick={closeMenu}>
            <span className="brand__mark" aria-hidden>
              ♥
            </span>
            <span className="brand__text">
              <strong>{brandName}</strong>
              <span>{specialty}</span>
            </span>
          </Link>

          <nav className="nav nav--desktop" aria-label="منوی اصلی">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="header__actions">
            <BookingCta className="btn btn--outline btn--sm header__cta-booking" />
            <PatientCta className="btn btn--patient btn--sm" />
            <button
              type="button"
              className="header__menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={menuOpen ? 'header__burger is-open' : 'header__burger'} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={menuOpen ? 'nav-drawer-backdrop is-open' : 'nav-drawer-backdrop'}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />
      <div
        id="mobile-nav"
        className={menuOpen ? 'nav-drawer is-open' : 'nav-drawer'}
        role="dialog"
        aria-modal="true"
        aria-label="منوی موبایل"
      >
        <div className="nav-drawer__head">
          <strong>منو</strong>
          <button type="button" className="nav-drawer__close" onClick={closeMenu} aria-label="بستن">
            ×
          </button>
        </div>
        <nav className="nav-drawer__links" aria-label="منوی موبایل">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={closeMenu} />
          ))}
        </nav>
        <div className="nav-drawer__actions">
          <BookingCta className="btn btn--primary btn--lg" />
          <PatientCta className="btn btn--patient btn--lg" />
          <a href={`tel:${phone}`} className="btn btn--outline btn--lg">
            تماس {phoneDisplay}
          </a>
        </div>
      </div>
    </>
  );
}
