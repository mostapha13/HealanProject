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

type FlatRow = {
  accessMenuId: number;
  accessFormId?: number;
  title: string;
  url: string;
  depth: number;
  kind: string;
  parentMenuId?: number | null;
  order: number;
  isActive: boolean;
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
  isActive: true,
};

function resolveTitle(item: AccessMenuTreeItem): string {
  return item.title || item.accessForm?.formTitle || item.accessForm?.url || `منو ${item.accessMenuId}`;
}

function flattenMenus(
  items: AccessMenuTreeItem[],
  depth = 0,
  parentMenuId: number | null = null
): FlatRow[] {
  const rows: FlatRow[] = [];
  items.forEach((item, index) => {
    const url = item.accessForm?.url ?? '';
    const isAction = /\/(add|edit|delete|publish)$/i.test(url);
    const isSystem = item.accessMenuId >= 5101 && item.accessMenuId < 5200;
    rows.push({
      accessMenuId: item.accessMenuId,
      accessFormId: item.accessFormId,
      title: `${depth > 0 ? '— '.repeat(depth) : ''}${resolveTitle(item)}`,
      url: url || '—',
      depth,
      kind: isAction ? 'عملیات' : url ? 'صفحه' : 'گروه',
      parentMenuId,
      order: item.order || index + 1,
      isActive: item.isActive !== false,
      isSystem,
    });
    if (item.children?.length) {
      rows.push(...flattenMenus(item.children, depth + 1, item.accessMenuId));
    }
  });
  return rows;
}

function AccessFormsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [tree, setTree] = useState<AccessMenuTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => flattenMenus(tree), [tree]);
  const visibleRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.url.toLowerCase().includes(q) ||
        row.kind.includes(q)
    );
  }, [rows, filter]);

  const parentOptions = useMemo(
    () => [
      { value: 0, label: '— ریشه (بدون والد) —' },
      ...rows
        .filter((row) => !row.url || row.url === '—' || row.kind === 'گروه')
        .map((row) => ({ value: row.accessMenuId, label: row.title })),
    ],
    [rows]
  );

  const load = async () => {
    setLoading(true);
    try {
      setTree(await fetchAccessMenuTree());
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = (parentMenuId: number | null = null, isFolder = false) => {
    setForm({
      ...EMPTY_FORM,
      parentMenuId,
      isFolder,
      order: rows.filter((r) => (r.parentMenuId ?? null) === parentMenuId).length + 1,
    });
    setShowForm(true);
  };

  const openEdit = (row: FlatRow) => {
    setForm({
      accessFormId: row.accessFormId ?? 0,
      accessMenuId: row.accessMenuId,
      formTitle: row.title.replace(/^(—\s+)+/, '').trim(),
      url: row.url === '—' ? '' : row.url,
      parentMenuId: row.parentMenuId ?? null,
      order: row.order,
      isFolder: !row.url || row.url === '—',
      isActive: row.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.formTitle.trim()) {
      onAlert({ type: 'error', message: 'عنوان الزامی است' });
      return;
    }
    if (!form.isFolder && !form.url.trim()) {
      onAlert({ type: 'error', message: 'برای صفحه، آدرس URL الزامی است' });
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
        isActive: form.isActive,
      });
      setShowForm(false);
      await load();
      onAlert({ type: 'success', message: 'منو ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row: FlatRow) => {
    try {
      await saveAccessForm({
        accessFormId: row.accessFormId,
        accessMenuId: row.accessMenuId,
        formTitle: row.title.replace(/^(—\s+)+/, '').trim(),
        url: row.url === '—' ? '' : row.url,
        parentMenuId: row.parentMenuId,
        order: row.order,
        isFolder: !row.url || row.url === '—',
        isActive: !row.isActive,
      });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const handleDelete = async (row: FlatRow) => {
    if (!(await confirmDelete(`منوی «${row.title.replace(/^(—\s+)+/, '')}» غیرفعال/حذف شود؟`))) return;
    try {
      await deleteAccessForm(row.accessMenuId);
      await load();
      onAlert({ type: 'success', message: 'منو غیرفعال شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="تعریف دسترسی‌ها"
        subtitle="چیدمان منوی سمت چپ کلینیک — افزودن، ویرایش، فعال/غیرفعال و حذف گروه‌ها و صفحات"
        action={
          <div className="healan-actions">
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => openCreate(null, true)}>
              + گروه منو
            </button>
            <button type="button" className="healan-btn healan-btn--primary" onClick={() => openCreate(null, false)}>
              + صفحه / فرم
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>{form.accessMenuId ? 'ویرایش منو' : form.isFolder ? 'گروه جدید' : 'صفحه جدید'}</h3>
          </div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>عنوان</label>
                <input
                  className="healan-input"
                  value={form.formTitle}
                  onChange={(e) => setForm({ ...form, formTitle: e.target.value })}
                />
              </div>
              <div className="healan-form-field">
                <label>نوع</label>
                <SearchableSelect
                  value={form.isFolder ? 1 : 0}
                  allowClear={false}
                  onChange={(v) => setForm({ ...form, isFolder: (v ?? 0) === 1, url: (v ?? 0) === 1 ? '' : form.url })}
                  options={[
                    { value: 0, label: 'صفحه / فرم (با URL)' },
                    { value: 1, label: 'گروه منو (بدون URL)' },
                  ]}
                />
              </div>
              {!form.isFolder && (
                <div className="healan-form-field">
                  <label>آدرس (URL)</label>
                  <input
                    className="healan-input"
                    dir="ltr"
                    placeholder="/basic-data/example"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
              )}
              <div className="healan-form-field">
                <label>منوی والد</label>
                <SearchableSelect
                  value={form.parentMenuId ?? 0}
                  allowClear={false}
                  onChange={(v) => setForm({ ...form, parentMenuId: !v || v === 0 ? null : Number(v) })}
                  options={parentOptions}
                />
              </div>
              <div className="healan-form-field">
                <label>ترتیب</label>
                <input
                  className="healan-input"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="healan-form-field">
                <label>وضعیت</label>
                <SearchableSelect
                  value={form.isActive ? 1 : 0}
                  allowClear={false}
                  onChange={(v) => setForm({ ...form, isActive: (v ?? 1) === 1 })}
                  options={[
                    { value: 1, label: 'فعال — در منو نمایش داده شود' },
                    { value: 0, label: 'غیرفعال — مخفی از منو' },
                  ]}
                />
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void handleSave()}>
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button type="button" className="healan-btn healan-btn--muted" onClick={() => setShowForm(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__header">
          <h3>درخت منو</h3>
          <input
            className="healan-input"
            style={{ maxWidth: 280 }}
            placeholder="جستجو در عنوان یا URL..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>نوع</th>
                  <th>URL</th>
                  <th>ترتیب</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.accessMenuId} style={{ opacity: row.isActive ? 1 : 0.55 }}>
                    <td>
                      <strong>{row.title}</strong>
                      {row.isSystem && (
                        <span className="healan-badge healan-badge--muted" style={{ marginInlineStart: 8 }}>
                          سیستمی
                        </span>
                      )}
                    </td>
                    <td>{row.kind}</td>
                    <td dir="ltr">{row.url}</td>
                    <td>{row.order}</td>
                    <td>{row.isActive ? 'فعال' : 'غیرفعال'}</td>
                    <td>
                      <div className="healan-actions">
                        <button
                          type="button"
                          className="healan-btn healan-btn--sm healan-btn--action healan-btn--edit"
                          onClick={() => openEdit(row)}
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--sm healan-btn--outline"
                          onClick={() => openCreate(row.accessMenuId, false)}
                        >
                          + زیرمنو
                        </button>
                        <button
                          type="button"
                          className={`healan-btn healan-btn--sm healan-btn--action ${
                            row.isActive ? 'healan-btn--unpublish' : 'healan-btn--publish'
                          }`}
                          onClick={() => void handleToggleActive(row)}
                        >
                          {row.isActive ? 'غیرفعال' : 'فعال'}
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--sm healan-btn--action healan-btn--danger"
                          onClick={() => void handleDelete(row)}
                        >
                          حذف
                        </button>
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
