import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import { fetchAccessMenuTree, type AccessMenuTreeItem } from '../../api/userAccessApi';
import { PageHeader } from '../../components/Ui';

function menuTitle(item: AccessMenuTreeItem, depth = 0): string {
  const prefix = depth > 0 ? '— '.repeat(depth) : '';
  const label = item.title || item.accessForm?.formTitle || item.accessForm?.url || `منو ${item.accessMenuId}`;
  return `${prefix}${label}`;
}

function flattenMenus(items: AccessMenuTreeItem[], depth = 0): { id: number; title: string; url: string; depth: number; kind: string }[] {
  const rows: { id: number; title: string; url: string; depth: number; kind: string }[] = [];
  items.forEach((item) => {
    const url = item.accessForm?.url ?? '';
    const isAction = /\/(add|edit|delete|publish)$/.test(url);
    rows.push({
      id: item.accessMenuId,
      title: menuTitle(item, depth),
      url: url || '—',
      depth,
      kind: isAction ? 'عملیات' : url ? 'صفحه / فرم' : 'گروه',
    });
    if (item.children?.length) {
      rows.push(...flattenMenus(item.children, depth + 1));
    }
  });
  return rows;
}

function AccessFormsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<AccessMenuTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccessMenuTree()
      .then(setItems)
      .catch(onAlert)
      .finally(() => setLoading(false));
  }, []);

  const rows = flattenMenus(items);

  return (
    <>
      <PageHeader
        title="تعریف دسترسی‌ها"
        subtitle="ساختار منوها و عملیات سامانه — برای تخصیص به نقش‌ها از «سطح دسترسی نقش‌ها» استفاده کنید (زیرمنوهای افزودن، ویرایش، حذف و نمایش)"
      />
      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : rows.length === 0 ? (
            <div className="healan-empty">منویی یافت نشد</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>عنوان منو / فرم</th>
                  <th>نوع</th>
                  <th>آدرس (URL)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.kind}</td>
                    <td><code>{row.url}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(AccessFormsPage);
