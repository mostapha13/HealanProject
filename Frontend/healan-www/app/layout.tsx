import type { Metadata } from 'next';
import { DisplayControls } from '@/components/DisplayControls';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drshahrooei.ir'
  ),
  title: {
    default: 'مطب تخصصی قلب و عروق',
    template: '%s | دکتر شهرویی',
  },
  description: 'سایت رسمی مطب تخصصی قلب و عروق',
};

const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('healan-theme');
    if (t === 'classic' || t === 'warm' || t === 'minimal') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute('data-theme', 'classic');
    }
    var n = localStorage.getItem('healan-night');
    document.documentElement.setAttribute('data-night', n === '1' ? 'true' : 'false');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'classic');
    document.documentElement.setAttribute('data-night', 'false');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-theme="classic"
      data-night="false"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <DisplayControls />
        <FloatingAssistantButton />
      </body>
    </html>
  );
}
