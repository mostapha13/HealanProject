import React, { useEffect, useState } from 'react';
import { Pagination } from 'antd';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { BlogPostDetail, BlogPostSummary } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanFileUpload, type FileUploadMeta } from '../../components/HealanFileUpload';
import { RichTextEditor } from '../../components/RichTextEditor';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useUserAccess } from '../../context/UserAccessContext';
import { hasBlogAccess } from '../../api/userAccessApi';

const PAGE_SIZE = 10;

const PUBLISH_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'true', label: 'منتشر شده' },
  { value: 'false', label: 'پیش‌نویس / مخفی' },
];

function slugPreview(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{Nd}\-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const emptyForm = (): BlogPostDetail => ({
  blogPostId: 0,
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  coverImageUrl: '',
  coverImageFileId: '',
  isPublished: false,
  publishedAt: '',
  createdAt: '',
});

function BlogAdminPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { accessRole } = useUserAccess();
  const canAdd = hasBlogAccess(accessRole, 'add');
  const canEdit = hasBlogAccess(accessRole, 'edit');
  const canDelete = hasBlogAccess(accessRole, 'delete');
  const canPublish = hasBlogAccess(accessRole, 'publish');
  const [items, setItems] = useState<BlogPostSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BlogPostDetail>(emptyForm);
  const [coverFile, setCoverFile] = useState<FileUploadMeta | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.blogList({
        filterText: filterText || undefined,
        isPublished: publishFilter === '' ? undefined : publishFilter === 'true',
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, publishFilter]);

  const openNew = () => {
    if (!canAdd) {
      onAlert({ type: 'error', message: 'دسترسی افزودن مطلب بلاگ را ندارید' });
      return;
    }
    setForm(emptyForm());
    setCoverFile(null);
    setShowForm(true);
  };

  const openEdit = async (item: BlogPostSummary) => {
    if (!canEdit) {
      onAlert({ type: 'error', message: 'دسترسی ویرایش بلاگ را ندارید' });
      return;
    }
    try {
      const detail = await healanApi.portal.blogInfo(item.blogPostId);
      if (!detail) {
        onAlert({ type: 'error', message: 'مطلب یافت نشد' });
        return;
      }
      setForm(detail);
      setCoverFile(
        detail.coverImageFileId
          ? { fileId: detail.coverImageFileId, fileName: 'تصویر شاخص', link: detail.coverImageUrl }
          : null
      );
      setShowForm(true);
    } catch (err) {
      onAlert(err);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      onAlert({ type: 'error', message: 'عنوان الزامی است' });
      return;
    }
    if (!form.body.trim() || form.body === '<p><br></p>') {
      onAlert({ type: 'error', message: 'متن مطلب الزامی است' });
      return;
    }
    if (form.blogPostId > 0 && !canEdit) {
      onAlert({ type: 'error', message: 'دسترسی ویرایش بلاگ را ندارید' });
      return;
    }
    if (form.blogPostId <= 0 && !canAdd) {
      onAlert({ type: 'error', message: 'دسترسی افزودن مطلب بلاگ را ندارید' });
      return;
    }

    setSaving(true);
    try {
      await healanApi.portal.blogRegister({
        blogPostId: form.blogPostId > 0 ? form.blogPostId : undefined,
        title: form.title.trim(),
        slug: form.slug.trim() || slugPreview(form.title),
        excerpt: form.excerpt?.trim() || undefined,
        body: form.body,
        coverImageUrl: coverFile?.link ?? form.coverImageUrl,
        coverImageFileId: coverFile?.fileId ?? undefined,
        isPublished: form.isPublished,
        publishedAt: form.publishedAt || undefined,
      });
      setShowForm(false);
      await load();
      onAlert({ type: 'success', message: 'مطلب بلاگ ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: BlogPostSummary) => {
    if (!canPublish) {
      onAlert({ type: 'error', message: 'دسترسی تغییر وضعیت نمایش را ندارید' });
      return;
    }
    try {
      const detail = await healanApi.portal.blogInfo(item.blogPostId);
      if (!detail) return;
      await healanApi.portal.blogRegister({
        blogPostId: detail.blogPostId,
        title: detail.title,
        slug: detail.slug,
        excerpt: detail.excerpt,
        body: detail.body,
        coverImageUrl: detail.coverImageUrl,
        coverImageFileId: detail.coverImageFileId,
        isPublished: !detail.isPublished,
        publishedAt: detail.publishedAt,
      });
      await load();
      onAlert({
        type: 'success',
        message: detail.isPublished ? 'مطلب از نمایش خارج شد' : 'مطلب منتشر شد',
      });
    } catch (err) {
      onAlert(err);
    }
  };

  const remove = async (id: number) => {
    if (!canDelete) {
      onAlert({ type: 'error', message: 'دسترسی حذف مطلب بلاگ را ندارید' });
      return;
    }
    if (!window.confirm('این مطلب حذف شود؟')) return;
    try {
      await healanApi.portal.blogDelete(id);
      await load();
      onAlert({ type: 'success', message: 'مطلب حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="بلاگ"
        subtitle="نوشتن، ویرایش و مدیریت نمایش مطالب بلاگ در سایت مطب"
        action={
          canAdd ? (
            <button type="button" className="healan-btn healan-btn--primary" onClick={openNew}>
              مطلب جدید
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>{form.blogPostId > 0 ? 'ویرایش مطلب' : 'مطلب جدید'}</h3>
          </div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>عنوان</label>
                <input
                  className="healan-input"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      slug: prev.slug || slugPreview(title),
                    }));
                  }}
                  placeholder="عنوان مطلب"
                />
              </div>
              <div className="healan-form-field">
                <label>نامک (Slug)</label>
                <input
                  className="healan-input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="مثال: healthy-heart-tips"
                  dir="ltr"
                />
              </div>
              <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>خلاصه</label>
                <textarea
                  className="healan-input"
                  rows={2}
                  value={form.excerpt ?? ''}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="خلاصه کوتاه برای لیست بلاگ"
                />
              </div>
              <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>تصویر شاخص</label>
                <HealanFileUpload value={coverFile} onChange={setCoverFile} />
              </div>
              <div className="healan-form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    disabled={!canPublish}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  />{' '}
                  نمایش در سایت
                </label>
              </div>
            </div>

            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>متن مطلب</label>
              <RichTextEditor value={form.body} onChange={(body) => setForm({ ...form, body })} />
            </div>

            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void handleSave()}>
                {saving ? 'در حال ذخیره...' : 'ذخیره مطلب'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>جستجو</label>
              <input
                className="healan-input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="عنوان یا خلاصه..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    void load();
                  }
                }}
              />
            </div>
            <div className="healan-form-field">
              <label>وضعیت نمایش</label>
              <SearchableSelect
                value={publishFilter || null}
                onChange={(v) => {
                  setPublishFilter(v ? String(v) : '');
                  setPage(1);
                }}
                allowClear={false}
                options={PUBLISH_OPTIONS}
              />
            </div>
          </div>
          <div className="healan-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="healan-btn healan-btn--outline"
              onClick={() => {
                setPage(1);
                void load();
              }}
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">مطلبی یافت نشد</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>نامک</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.blogPostId}>
                    <td>{item.title}</td>
                    <td dir="ltr">{item.slug}</td>
                    <td>{convertDateAndTimeToJalali(item.publishedAt ?? item.createdAt)}</td>
                    <td>
                      <span className={`healan-badge ${item.isPublished ? 'healan-badge--success' : 'healan-badge--muted'}`}>
                        {item.isPublished ? 'منتشر شده' : 'مخفی'}
                      </span>
                    </td>
                    <td>
                      <div className="healan-actions">
                        {canEdit && (
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void openEdit(item)}>
                            ویرایش
                          </button>
                        )}
                        {canPublish && (
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void togglePublish(item)}>
                            {item.isPublished ? 'عدم نمایش' : 'نمایش'}
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void remove(item.blogPostId)}>
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
        {totalCount > PAGE_SIZE && (
          <div className="healan-card__body" style={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination current={page} pageSize={PAGE_SIZE} total={totalCount} onChange={setPage} showSizeChanger={false} />
          </div>
        )}
      </div>
    </>
  );
}

export default withAlert(BlogAdminPage);
