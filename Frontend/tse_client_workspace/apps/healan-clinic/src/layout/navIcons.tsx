import React from 'react';

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconDashboard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Svg>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function IconUser(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

export function IconClipboard(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </Svg>
  );
}

export function IconStethoscope(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 2v6a3 3 0 0 0 6 0V2" />
      <path d="M14 14v3a4 4 0 0 1-8 0v-1" />
      <circle cx="18" cy="7" r="2" />
      <path d="M6 2v6a6 6 0 0 0 8 5.66" />
    </Svg>
  );
}

export function IconFile(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </Svg>
  );
}

export function IconBuilding(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </Svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

export function IconGrid(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}

export function IconTag(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" />
    </Svg>
  );
}

export function IconBot(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 2v4M9 14h.01M15 14h.01M8 18h8" />
    </Svg>
  );
}

export function IconKey(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.5 12.5 20 3M16 3h4v4" />
    </Svg>
  );
}

export function IconChart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  );
}

export function IconMessage(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </Svg>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

export function IconHeart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.8 7.5a4.8 4.8 0 0 0-8.8-2.4A4.8 4.8 0 0 0 3.2 7.5C3.2 13 12 20 12 20s8.8-7 8.8-12.5z" />
    </Svg>
  );
}

export function IconPen(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}

export function IconWorkflow(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3a3 3 0 0 0 3 3h3M18 9v3a3 3 0 0 1-3 3h-3" />
    </Svg>
  );
}

export function IconGlobe(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    </Svg>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </Svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Svg>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconPin(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 17v5M9 3h6l-1 7h3l-5 5-5-5h3z" />
    </Svg>
  );
}

export function IconChevron(p: IconProps & { open?: boolean }) {
  return (
    <Svg className={`${p.className || ''}${p.open ? ' is-open' : ''}`}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function resolveNavIcon(path?: string, label?: string, isFolder?: boolean): React.ReactNode {
  const p = (path || '').toLowerCase();
  const l = (label || '').toLowerCase();

  if (isFolder) {
    if (l.includes('دسترسی') || l.includes('سطوح') || l.includes('کاربر')) return <IconUsers />;
    if (l.includes('کلینیک') || l.includes('clinic')) return <IconHeart />;
    if (l.includes('نوبت') || l.includes('booking')) return <IconCalendar />;
    if (l.includes('پایه') || l.includes('basic')) return <IconFolder />;
    if (l.includes('سایت') || l.includes('site') || l.includes('محتوا')) return <IconGlobe />;
    if (l.includes('گزارش') || l.includes('report')) return <IconChart />;
    if (l.includes('پیامک') || l.includes('sms')) return <IconMessage />;
    if (l.includes('بیمار') || l.includes('patient')) return <IconUser />;
    if (l.includes('کاربر')) return <IconUsers />;
    return <IconFolder />;
  }

  if (p === '/' || l.includes('داشبورد')) return <IconDashboard />;
  if (p.includes('/queue') || l.includes('صف')) return <IconClipboard />;
  if (p.includes('/appointments') || l.includes('پذیرش')) return <IconCalendar />;
  if (p.includes('/patients') || l.includes('بیماران')) return <IconUsers />;
  if (p.includes('/blood-pressure') || l.includes('فشار')) return <IconHeart />;
  if (p.includes('/doctors') || l.includes('پزشک')) return <IconStethoscope />;
  if (p.includes('/prescriptions') || l.includes('نسخه')) return <IconFile />;
  if (p.includes('/companies') || l.includes('مرکز') || l.includes('شرکت')) return <IconBuilding />;
  if (p.includes('/insurance') || l.includes('بیمه')) return <IconShield />;
  if (p.includes('/services') || l.includes('خدمت')) return <IconGrid />;
  if (p.includes('/fees') || l.includes('تعرفه')) return <IconTag />;
  if (p.includes('/assistant') && p.includes('basic')) return <IconBot />;
  if (p.includes('/users') || l.includes('کاربر')) return <IconUsers />;
  if (p.includes('/roles') || p.includes('/access') || l.includes('دسترسی') || l.includes('نقش')) return <IconKey />;
  if (p.includes('/reports') || l.includes('نمودار') || l.includes('آمار')) return <IconChart />;
  if (p.includes('/sms') || l.includes('پیامک')) return <IconMessage />;
  if (p.includes('/signature') || l.includes('امضا')) return <IconPen />;
  if (p.includes('/workflow') || l.includes('کارتابل')) return <IconWorkflow />;
  if (p.includes('/booking') || l.includes('رزرو') || l.includes('برنامه')) return <IconCalendar />;
  if (p.includes('/site-content') || l.includes('بلاگ') || l.includes('نظرات') || l.includes('دانش')) return <IconGlobe />;
  if (p.includes('/rag') || l.includes('گفتگو') || l.includes('چت')) return <IconChat />;
  if (p.includes('/assistant')) return <IconChat />;
  if (p.includes('/patient')) return <IconUser />;
  return <IconGrid />;
}
