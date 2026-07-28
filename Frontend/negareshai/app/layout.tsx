import "./globals.css";

export const metadata = {
  title: "نگارش AI | مدیریت هوشمند اسناد و قراردادها",
  description: "سامانه امن و هوشمند مدیریت، تحلیل و تطبیق اسناد سازمانی"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
