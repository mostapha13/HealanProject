/** Server-rendered download block — always present in HTML (no client-only hide). */
export const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL ?? '/downloads/healan-patient.apk';

export const IOS_PWA_URL = process.env.NEXT_PUBLIC_IOS_PWA_URL ?? '/mobile/';

const BUILD = 'build-v9-appdl';

function IconAndroid() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.6 9.48 19.2 6.7a.5.5 0 0 0-.86-.5l-1.64 2.84A7.9 7.9 0 0 0 12 8c-1.7 0-3.26.53-4.7 1.44L5.66 6.2a.5.5 0 1 0-.86.5l1.6 2.78A7.96 7.96 0 0 0 4 15.5V16a2 2 0 0 0 2 2h.5v2.25a1.25 1.25 0 0 0 2.5 0V18h6v2.25a1.25 1.25 0 0 0 2.5 0V18H18a2 2 0 0 0 2-2v-.5a7.96 7.96 0 0 0-2.4-5.02ZM8.25 14.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
      />
    </svg>
  );
}

function IconApple() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7Zm-2-6.3c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2Z"
      />
    </svg>
  );
}

type CompactProps = {
  className?: string;
};

/** Compact two-option block for header drawer / footer */
export function AppDownloadLinks({ className }: CompactProps) {
  return (
    <div className={className ? `app-dl-links ${className}` : 'app-dl-links'} data-build={BUILD}>
      <p className="app-dl-links__title">دانلود اپلیکیشن</p>
      <a
        className="app-dl-links__item app-dl-links__item--android"
        href={ANDROID_APK_URL}
        download="healan-patient.apk"
      >
        <span className="app-dl-links__icon" aria-hidden>
          <IconAndroid />
        </span>
        <span>
          <strong>دانلود برای اندروید</strong>
          <small>فایل APK</small>
        </span>
      </a>
      <a
        className="app-dl-links__item app-dl-links__item--ios"
        href={IOS_PWA_URL}
      >
        <span className="app-dl-links__icon" aria-hidden>
          <IconApple />
        </span>
        <span>
          <strong>دانلود برای iOS</strong>
          <small>نسخه PWA</small>
        </span>
      </a>
    </div>
  );
}

/** Full homepage section — always in SSR HTML */
export function DownloadAppSection() {
  return (
    <section
      id="download-app"
      className="download-app"
      data-build={BUILD}
      aria-labelledby="download-app-title"
    >
      <div className="container">
        <p className="download-app__eyebrow">{BUILD}</p>
        <h2 id="download-app-title">دانلود اپلیکیشن</h2>
        <p className="download-app__lead">
          نسخه اندروید را مستقیم نصب کنید یا نسخه iOS را به‌صورت PWA به صفحه اصلی گوشی اضافه کنید.
        </p>
        <div className="download-app__grid">
          <a
            className="download-app__card download-app__card--android"
            href={ANDROID_APK_URL}
            download="healan-patient.apk"
          >
            <span className="download-app__icon" aria-hidden>
              <IconAndroid />
            </span>
            <strong>دانلود برای اندروید</strong>
            <span>فایل APK — نصب مستقیم روی گوشی</span>
          </a>
          <a className="download-app__card download-app__card--ios" href={IOS_PWA_URL}>
            <span className="download-app__icon" aria-hidden>
              <IconApple />
            </span>
            <strong>دانلود برای iOS</strong>
            <span>نسخه PWA — باز کردن و Add to Home Screen</span>
          </a>
        </div>
      </div>
    </section>
  );
}
