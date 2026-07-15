import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import {
  deleteAccessForm,
  fetchAccessMenuTree,
  saveAccessForm,
  type AccessMenuTreeItem,
} from '../../api/userAccessApi';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { confirmDelete } from '../../components/confirmDialog';

const FOLDER_TITLES: Record<number, string> = {
  5102: 'مدیریت کلینیک',
  5108: 'اطلاعات پایه',
  5113: 'مدیریت کاربران',
  5120: 'محتوای سایت',
};

type FlatRow = {
  accessMenuId: number;
  accessFormId?: number;
  title: string;
  url: string;
  depth: number;
  kind: string;
  parentMenuId?: number | null;
  order: number;
  isSystem: boolean;
};

const EMPTY_FORM = {
  accessFormId: 0,
  accessMenuId: 0,
  formTitle: '',
  url: '',
  parentMenuId: null as number | null,
  order: 0,
  isFolder: false,
};

function resolveTitle(item: AccessMenuTreeItem): string {
  return (
    item.title ||
    item.accessForm?.formTitle ||
    FOLDER_TITLES[item.accessMenuId] ||
    item.accessForm?.url ||
    `منو ${item.accessMenuId}`
  );
}

function flattenMenus(
  items: AccessMenuTreeItem[],
  depth = 0,
  parentMenuId: number | null = null
): FlatRow[] {
  const rows: FlatRow[] = [];
  items.forEach((item, index) => {
    const url = item.accessForm?.url ?? '';
    // مرکز درمانی مخفی شده از UI
    if (url === '/basic-data/companies' || item.accessMenuId === 5109) {
      return;
    }
    const isAction = /\/(add|edit|delete|publish)$/.test(url);
    const isSystem = item.accessMenuId >= 5101 && item.accessMenuId <= 5128;
    rows.push({
      accessMenuId: item.accessMenuId,
      accessFormId: item.accessFormId,
      title: `${depth > 0 ? '— '.repeat(depth) : ''}${resolveTitle(item)}`,
      url: url || '—',
      depth,
      kind: isAction ? 'عملیات' : url ? 'صفحه / فرم' : 'گروه',
      parentMenuId,
      order: index + 1,
      isSystem,
    });
    if (item.children?.length) {
      rows.push(...flattenMenus(item.children, depth + 1, item.accessMenuId));
    }
  });
  return rows;
}

function AccessFormsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<AccessMenuTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () =>
    fetchAccessMenuTree()
      .then(setItems)
      .catch(onAlert);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => flattenMenus(items), [items]);

  const parentOptions = useMemo(
    () =>
      rows.map((row) => ({
        value: row.accessMenuId,
        label: row.title,
      })),
    [rows]
  );

  const openCreate = (asFolder = false) => {
    setForm({ ...EMPTY_FORM, isFolder: asFolder });
    setShowForm(true);
  };

  const openEdit = (row: FlatRow) => {
    setForm({
      accessFormId: row.accessFormId ?? 0,
      accessMenuId: row.accessMenuId,
      formTitle: row.title.replace(/^—\s*/g, '').trim(),
      url: row.url === '—' ? '' : row.url,
      parentMenuId: row.parentMenuId ?? null,
      order: row.order,
      isFolder: !row.url || row.url === '—',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.formTitle.trim()) {
      onAlert({ type: 'error', message: 'عنوان الزامی است' });
      return;
    }
    if (!form.isFolder && !form.url.trim()) {
      onAlert({ type: 'error', message: 'آدرس URL الزامی است' });
      return;
    }

    setSaving(true);
    try {
      await saveAccessForm({
        accessFormId: form.accessFormId,
        accessMenuId: form.accessMenuId,
        formTitle: form.formTitle.trim(),
        url: form.isFolder ? '' : form.url.trim(),
        parentMenuId: form.parentMenuId,
        order: form.order,
        isFolder: form.isFolder,
      });
      setShowForm(false);
      await load();
      onAlert({ type: 'success', message: 'با موفقیت ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: FlatRow) => {
    if (row.isSystem) {
      onAlert({ type: 'error', message: 'منوهای سیستمی قابل حذف نیستند' });
      return;
    }
    if (!(await confirmDelete(`منوی «${row.title.replace(/^—\s*/g, '')}» حذف شود؟`))) {
      return;
    }
    try {
      await deleteAccessForm(row.accessMenuId);
      await load();
      onAlert({ type: 'success', message: 'حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="تعریف دسترسی‌ها"
        subtitle="ساختار منوها و عملیات سامانه — برای تخصیص به نقش‌ها از «سطح دسترسی نقش‌ها» استفاده کنید"
        action={
          <div className="healan-actions">
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => openCreate(true)}>
              + گروه
            </button>
            <button type="button" className="healan-btn healan-btn--primary" onClick={() => openCreate(false)}>
              + فرم / صفحه
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>عنوان</label>
                <input
                  value={form.formTitle}
                  onChange={(e) => setForm({ ...form, formTitle: e.target.value })}
                />
              </div>
              {!form.isFolder && (
                <div className="healan-form-field">
                  <label>آدرس (URL)</label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="/example"
                  />
                </div>
              )}
              <div className="healan-form-field">
                <label>منوی والد</label>
                <SearchableSelect
                  value={form.parentMenuId}
                  onChange={(v) => setForm({ ...form, parentMenuId: v == null ? null : Number(v) })}
                  placeholder="ریشه (بدون والد)"
                  allowClear
                  options={parentOptions.filter((o) => o.value !== form.accessMenuId)}
                />
              </div>
              <div className="healan-form-field">
                <label>ترتیب</label>
                <input
                  type="number"
                  min={0}
                  value={form.order || ''}
                  onChange={(e) => setForm({ ...form, order: +e.target.value || 0 })}
                />
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void handleSave()}>
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.accessMenuId}>
                    <td>{row.title}</td>
                    <td>{row.kind}</td>
                    <td>
                      <code>{row.url}</code>
                    </td>
                    <td>
                      <div className="healan-actions">
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => openEdit(row)}
                        >
                          ویرایش
                        </button>
                        {!row.isSystem && (
                          <button
                            type="button"
                            className="healan-btn healan-btn--outline healan-btn--sm"
                            onClick={() => void handleDelete(row)}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
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
