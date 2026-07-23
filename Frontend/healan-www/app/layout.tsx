import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
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
        <FloatingAssistantButton />
      </body>
    </html>
  );
}
