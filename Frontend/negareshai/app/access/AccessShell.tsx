"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const tabs = [
  ["/access/users", "کاربران"],
  ["/access/roles", "نقش‌ها"],
  ["/access/role-permissions", "دسترسی نقش‌ها"],
  ["/access/user-permissions", "دسترسی مستقیم کاربران"],
] as const;

export default function AccessShell({ title, description, badge, children }: {
  title: string; description: string; badge?: string; children: ReactNode;
}) {
  const pathname = usePathname();
  return <main className="access-page" dir="rtl">
    <header className="access-hero">
      <div className="access-hero-mark">◆</div>
      <div><span>مرکز مدیریت هویت و دسترسی</span><h1>{title}</h1><p>{description}</p></div>
      {badge && <b>{badge}</b>}
    </header>
    <nav className="access-tabs" aria-label="مدیریت هویت و دسترسی">
      {tabs.map(([href, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}
    </nav>
    {children}
  </main>;
}
