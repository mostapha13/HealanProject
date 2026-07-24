// Expo Router HTML shell — PWA / iOS Home Screen
import type { PropsWithChildren } from 'react';

const BASE = '/mobile';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
        />
        <meta name="theme-color" content="#C6E000" />
        <meta name="color-scheme" content="light" />
        <meta name="application-name" content="هیلن کلینیک" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="هیلن کلینیک" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="description"
          content="اپلیکیشن موبایل پرسنل کلینیک قلب و عروق دکتر شهرویی — صف، پذیرش، نسخه، سوابق بیمار"
        />
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="icon" type="image/png" href={`${BASE}/favicon.png`} />
        <link rel="apple-touch-icon" href={`${BASE}/icons/apple-touch-icon.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${BASE}/icons/apple-touch-icon.png`} />
        <title>هیلن کلینیک</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; margin: 0; background: #F4F5F7; }
              body { overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('${BASE}/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
