import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found" dir="rtl">
      <div className="not-found__card">
        <p className="not-found__code">۴۰۴</p>
        <h1>صفحه موردنظر پیدا نشد</h1>
        <p>
          ممکن است آدرس تغییر کرده باشد یا صفحه‌ای با این نشانی وجود نداشته باشد.
        </p>
        <div className="not-found__actions">
          <Link className="btn btn--primary" href="/">
            بازگشت به صفحه اصلی
          </Link>
          <Link className="btn btn--outline" href="/blog">
            مطالب قلب و عروق و واریس
          </Link>
        </div>
      </div>
    </main>
  );
}
