"use client";

import { useEffect, useState } from "react";
import { AccessMenu, listManagementMenus } from "../../../lib/api";

function Branch({ node }: { node: AccessMenu }) {
  return (
    <li>
      <div className="permission-row">
        <strong>{node.title || node.accessForm?.formTitle || `منو ${node.accessMenuId}`}</strong>
        <span>{node.accessForm?.url || "گروه منو"}</span>
      </div>
      {node.children?.length ? <ul>{node.children.map(child => <Branch key={child.accessMenuId} node={child} />)}</ul> : null}
    </li>
  );
}

export default function AccessDefinitionsPage() {
  const [menus, setMenus] = useState<AccessMenu[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { void listManagementMenus().then(setMenus).catch(error =>
    setMessage(error instanceof Error ? error.message : "دریافت تعریف منوها انجام نشد.")); }, []);
  return (
    <main className="access-page" dir="rtl">
      <header className="access-header"><div><span>مدیریت کاربران و دسترسی‌ها</span><h1>تعریف منوها و سطوح دسترسی</h1><p>این ساختار مرجع تخصیص مجوز به نقش‌ها و کاربران است.</p></div></header>
      <section className="access-card">
        {message && <p>{message}</p>}
        <ul className="permission-tree">{menus.map(menu => <Branch key={menu.accessMenuId} node={menu} />)}</ul>
      </section>
    </main>
  );
}
