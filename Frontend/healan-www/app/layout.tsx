import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { DisplayControls } from '@/components/DisplayControls';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drshahrooei.ir'
  ),
  title: {
    default: 'متخصص قلب و عروق و درمان واریس در شوشتر',
    template: '%s | دکتر شهرویی',
  },
  description: 'سایت رسمی دکتر معصومه شهرویی؛ متخصص قلب و عروق و درمان واریس در شوشتر',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
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
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body className={vazirmatn.variable}>
        {children}
        <DisplayControls />
        <FloatingAssistantButton />
      </body>
    </html>
  );
}
