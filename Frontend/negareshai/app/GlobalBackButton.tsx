"use client";

import { usePathname, useRouter } from "next/navigation";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/" || pathname.startsWith("/auth/")) return null;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(pathname.startsWith("/basic-data/") ? "/basic-data" : "/");
  }

  return (
    <button
      type="button"
      className="global-back-button"
      onClick={goBack}
      aria-label="بازگشت به صفحه قبل"
      title="بازگشت به صفحه قبل"
    >
      <span aria-hidden="true">→</span>
      <span>بازگشت</span>
    </button>
  );
}
