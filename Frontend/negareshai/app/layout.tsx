import "./globals.css";
import GlobalBackButton from "./GlobalBackButton";
import ActiveComparisonCard from "./ActiveComparisonCard";

export const metadata = {
  title: "نگارش AI | مدیریت هوشمند اسناد و قراردادها",
  description: "سامانه امن و هوشمند مدیریت، تحلیل و تطبیق اسناد سازمانی"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body><GlobalBackButton /><ActiveComparisonCard />{children}</body></html>;
}
