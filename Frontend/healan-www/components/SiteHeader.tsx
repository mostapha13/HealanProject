import Link from 'next/link';
import { BookingCta, PatientCta } from './CtaLinks';
import { ThemeSwitcher } from './ThemeSwitcher';

type Props = {
  brandName: string;
  specialty: string;
  phone: string;
  phoneDisplay: string;
  topbar: string;
};

export function SiteHeader({
  brandName,
  specialty,
  phone,
  phoneDisplay,
  topbar,
}: Props) {
  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span>{topbar}</span>
          <div className="topbar__end">
            <ThemeSwitcher />
            <a href={`tel:${phone}`} className="topbar__phone">
              {phoneDisplay}
            </a>
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container header__inner">
          <Link href="/" className="brand">
            <span className="brand__mark" aria-hidden>
              ♥
            </span>
            <span className="brand__text">
              <strong>{brandName}</strong>
              <span>{specialty}</span>
            </span>
          </Link>
          <nav className="nav" aria-label="منوی اصلی">
            <a href="/#about">درباره پزشک</a>
            <a href="/#services">خدمات</a>
            <a href="/#reviews">نظرات</a>
            <a href="/#contact">تماس</a>
            <Link href="/blog">بلاگ</Link>
            <a href="/assistant">دستیار</a>
          </nav>
          <div className="header__actions">
            <BookingCta className="btn btn--outline btn--sm" />
            <PatientCta className="btn btn--patient btn--sm" />
          </div>
        </div>
      </header>
    </>
  );
}
