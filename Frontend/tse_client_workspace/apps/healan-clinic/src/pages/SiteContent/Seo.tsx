import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalSeoPage } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { HealanFileUpload, type FileUploadMeta } from '../../components/HealanFileUpload';
import { confirmDelete } from '../../components/confirmDialog';

const emptyForm = (): PortalSeoPage => ({
  portalSeoPageId: 0,
  pageKey: '',
  path: '/',
  title: '',
  description: '',
  keywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  ogImageFileId: '',
  canonicalUrl: '',
  robots: 'index,follow',
  jsonLdExtra: '',
  isActive: true,
  sortOrder: 0,
});

function SeoAdminPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<PortalSeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PortalSeoPage>(emptyForm());
  const [ogFile, setOgFile] = useState<FileUploadMeta | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await healanApi.portal.seoList();
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setOgFile(null);
    setShowForm(true);
  };

  const openEdit = (item: PortalSeoPage) => {
    setForm({ ...item });
    setOgFile(
      item.ogImageFileId
        ? { fileId: item.ogImageFileId, fileName: 'تصویر OG', link: item.ogImageUrl }
        : null
    );
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.pageKey.trim() || !form.path.trim() || !form.title.trim()) {
      onAlert({ type: 'error', message: 'کلید، مسیر و عنوان الزامی است' });
      return;
    }
    setSaving(true);
    try {
      await healanApi.portal.seoRegister({
        portalSeoPageId: form.portalSeoPageId || undefined,
        pageKey: form.pageKey,
        path: form.path,
        title: form.title,
        description: form.description || null,
        keywords: form.keywords || null,
        ogTitle: form.ogTitle || null,
        ogDescription: form.ogDescription || null,
        ogImageUrl: ogFile?.link || form.ogImageUrl || null,
        ogImageFileId: ogFile?.fileId || null,
        canonicalUrl: form.canonicalUrl || null,
        robots: form.robots || 'index,follow',
        jsonLdExtra: form.jsonLdExtra || null,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      });
      onAlert({ type: 'success', message: 'SEO ذخیره شد' });
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDelete('این رکورد SEO حذف شود؟'))) return;
    try {
      await healanApi.portal.seoDelete(id);
      onAlert({ type: 'success', message: 'حذف شد' });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <div className="healan-page">
      <PageHeader
        title="تنظیمات SEO"
        subtitle="عنوان، توضیحات و Open Graph صفحات سایت عمومی (www) — قابل ویرایش برای گوگل و چت‌بات‌ها"
        action={
          <button type="button" className="healan-btn" onClick={openNew}>
            افزودن صفحه
          </button>
        }
      />

      {loading ? (
        <p className="healan-empty">در حال بارگذاری...</p>
      ) : (
        <div className="healan-card" style={{ overflowX: 'auto' }}>
          <table className="healan-table">
            <thead>
              <tr>
                <th>کلید</th>
                <th>مسیر</th>
                <th>عنوان</th>
                <th>فعال</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.portalSeoPageId}>
                  <td>{item.pageKey}</td>
                  <td dir="ltr">{item.path}</td>
                  <td>{item.title}</td>
                  <td>{item.isActive ? 'بله' : 'خیر'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(item)}>
                      ویرایش
                    </button>{' '}
                    <button type="button" className="healan-btn healan-btn--danger healan-btn--sm" onClick={() => void handleDelete(item.portalSeoPageId)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="healan-empty">
                    رکوردی نیست — «home» و «blog» پس از migrate ساخته می‌شوند.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <div className="healan-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="healan-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{form.portalSeoPageId ? 'ویرایش SEO' : 'افزودن SEO'}</h3>
            <div className="healan-form-grid">
              <label>
                کلید صفحه
                <input value={form.pageKey} onChange={(e) => setForm({ ...form, pageKey: e.target.value })} placeholder="home" dir="ltr" />
              </label>
              <label>
                مسیر
                <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/" dir="ltr" />
              </label>
              <label className="healan-form-span-2">
                عنوان (Title)
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="healan-form-span-2">
                توضیحات (Description)
                <textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className="healan-form-span-2">
                کلمات کلیدی
                <input value={form.keywords || ''} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </label>
              <label>
                OG Title
                <input value={form.ogTitle || ''} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} />
              </label>
              <label>
                Robots
                <input value={form.robots || 'index,follow'} onChange={(e) => setForm({ ...form, robots: e.target.value })} dir="ltr" />
              </label>
              <label className="healan-form-span-2">
                OG Description
                <textarea rows={2} value={form.ogDescription || ''} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} />
              </label>
              <label className="healan-form-span-2">
                Canonical URL
                <input value={form.canonicalUrl || ''} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} dir="ltr" />
              </label>
              <label>
                ترتیب
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                فعال
              </label>
              <div className="healan-form-span-2">
                <span>تصویر Open Graph</span>
                <HealanFileUpload value={ogFile} onChange={setOgFile} />
              </div>
              <label className="healan-form-span-2">
                JSON-LD اضافی (اختیاری)
                <textarea rows={4} value={form.jsonLdExtra || ''} onChange={(e) => setForm({ ...form, jsonLdExtra: e.target.value })} dir="ltr" placeholder='{"@type":"FAQPage",...}' />
              </label>
            </div>
            <div className="healan-modal__actions">
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>
                انصراف
              </button>
              <button type="button" className="healan-btn" disabled={saving} onClick={() => void handleSave()}>
                {saving ? '...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default withAlert(SeoAdminPage);
