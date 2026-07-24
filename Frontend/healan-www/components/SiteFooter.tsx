import Link from 'next/link';

type Props = {
  name: string;
  specialty: string;
  city: string;
};

const CLINIC_URL = 'https://clinic.drshahrooei.ir/';

export function SiteFooter({ name, specialty, city }: Props) {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <strong>{name}</strong>
          <span>
            {specialty} · {city}
          </span>
        </div>
        <div className="footer__links">
          <Link href="/blog">بلاگ</Link>
          <a href="/assistant">دستیار هوشمند</a>
          <a href="/booking">رزرو نوبت</a>
          <a href="/patient">ورود بیمار</a>
        </div>
        <div className="footer__clinic">
          <p>پرسنل و پزشکان</p>
          <a className="btn footer__clinic-btn" href={CLINIC_URL}>
            ورود به پنل کلینیک
          </a>
        </div>
      </div>
      <div className="container">
        <p className="footer__copy">
          © {new Date().getFullYear()} — تمامی حقوق محفوظ است · build-v12-menu
        </p>
      </div>
    </footer>
  );
}
