import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalSeoPage } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { HealanModal } from '../../components/HealanModal';
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

const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'ایندکس شود و لینک‌ها دنبال شوند (پیشنهادی)' },
  { value: 'noindex,follow', label: 'ایندکس نشود، لینک‌ها دنبال شوند' },
  { value: 'index,nofollow', label: 'ایندکس شود، لینک‌ها دنبال نشوند' },
  { value: 'noindex,nofollow', label: 'ایندکس و دنبال نشود' },
];

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

  const previewTitle = form.title || 'عنوان صفحه…';
  const previewDesc =
    form.description ||
    'توضیح کوتاه صفحه اینجا در نتایج گوگل دیده می‌شود (حدود ۱۵۰–۱۶۰ کاراکتر).';
  const titleLen = (form.title || '').length;
  const descLen = (form.description || '').length;

  const ogPreviewSrc = useMemo(
    () => ogFile?.link || form.ogImageUrl || '',
    [ogFile?.link, form.ogImageUrl]
  );

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

  const setField = <K extends keyof PortalSeoPage>(key: K, value: PortalSeoPage[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="healan-page">
      <PageHeader
        title="تنظیمات SEO"
        subtitle="عنوان، توضیحات و Open Graph صفحات سایت عمومی (www) — قابل ویرایش برای گوگل و شبکه‌های اجتماعی"
        action={
          <button type="button" className="healan-btn" onClick={openNew}>
            افزودن صفحه
          </button>
        }
      />

      <div className="seo-admin-hint healan-card">
        <strong>راهنمای سریع:</strong>
        <span>
          رکوردهای <code>home</code> (مسیر /) و <code>blog</code> (مسیر /blog) روی سایت Next
          اعمال می‌شوند. عنوان و توضیح در تگ‌های HTML و نتایج گوگل دیده می‌شوند؛ تصویر OG هنگام
          اشتراک در واتساپ/تلگرام/ایکس نمایش داده می‌شود.
        </span>
      </div>

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
                  <td>
                    <code className="seo-admin-code">{item.pageKey}</code>
                  </td>
                  <td dir="ltr">{item.path}</td>
                  <td>{item.title}</td>
                  <td>
                    <span
                      className={
                        item.isActive ? 'seo-admin-badge is-on' : 'seo-admin-badge'
                      }
                    >
                      {item.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="healan-btn healan-btn--outline healan-btn--sm"
                      onClick={() => openEdit(item)}
                    >
                      ویرایش
                    </button>{' '}
                    <button
                      type="button"
                      className="healan-btn healan-btn--danger healan-btn--sm"
                      onClick={() => void handleDelete(item.portalSeoPageId)}
                    >
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

      <HealanModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={form.portalSeoPageId ? 'ویرایش تنظیمات SEO' : 'افزودن صفحه SEO'}
        subtitle="فیلدها را بخش‌بندی پر کنید؛ پیش‌نمایش گوگل در پایین به‌روز می‌شود."
        icon="🔎"
        width={820}
        footer={
          <div className="healan-modal__footer-actions">
            <button
              type="button"
              className="healan-btn healan-btn--outline"
              onClick={() => setShowForm(false)}
            >
              انصراف
            </button>
            <button
              type="button"
              className="healan-btn"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'در حال ذخیره…' : 'ذخیره SEO'}
            </button>
          </div>
        }
      >
        <div className="seo-form">
          <section className="seo-form__section">
            <header className="seo-form__section-head">
              <h4>شناسه صفحه</h4>
              <p>کلید یکتا در سیستم و مسیر واقعی روی www</p>
            </header>
            <div className="seo-form__grid">
              <label className="seo-form__field">
                <span>
                  کلید صفحه <em>*</em>
                </span>
                <input
                  value={form.pageKey}
                  onChange={(e) => setField('pageKey', e.target.value)}
                  placeholder="home"
                  dir="ltr"
                />
                <small>مثال: home ، blog</small>
              </label>
              <label className="seo-form__field">
                <span>
                  مسیر (Path) <em>*</em>
                </span>
                <input
                  value={form.path}
                  onChange={(e) => setField('path', e.target.value)}
                  placeholder="/"
                  dir="ltr"
                />
                <small>مثال: / یا /blog</small>
              </label>
              <label className="seo-form__field">
                <span>ترتیب نمایش</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField('sortOrder', Number(e.target.value))}
                />
              </label>
              <label className="seo-form__switch">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                />
                <span>فعال باشد و در سایت عمومی اعمال شود</span>
              </label>
            </div>
          </section>

          <section className="seo-form__section">
            <header className="seo-form__section-head">
              <h4>نتایج جستجو (Google)</h4>
              <p>عنوان و توضیح متا — مهم‌ترین فیلدها برای کلیک در گوگل</p>
            </header>
            <div className="seo-form__grid seo-form__grid--1">
              <label className="seo-form__field">
                <span>
                  عنوان (Title) <em>*</em>
                  <b className={titleLen > 60 ? 'is-warn' : ''}>{titleLen}/60</b>
                </span>
                <input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="مثلاً مطب تخصصی قلب و عروق دکتر شهرویی | شوشتر"
                />
                <small>پیشنهاد: حداکثر حدود ۶۰ کاراکتر</small>
              </label>
              <label className="seo-form__field">
                <span>
                  توضیحات (Meta Description)
                  <b className={descLen > 160 ? 'is-warn' : ''}>{descLen}/160</b>
                </span>
                <textarea
                  rows={3}
                  value={form.description || ''}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="یک یا دو جمله جذاب درباره خدمات مطب…"
                />
                <small>پیشنهاد: حدود ۱۵۰–۱۶۰ کاراکتر</small>
              </label>
              <label className="seo-form__field">
                <span>کلمات کلیدی</span>
                <input
                  value={form.keywords || ''}
                  onChange={(e) => setField('keywords', e.target.value)}
                  placeholder="متخصص قلب شوشتر، اکوکاردیوگرافی، نوبت قلب"
                />
                <small>تأثیر مستقیم کم روی گوگل؛ برای نظم داخلی مفید است</small>
              </label>
              <label className="seo-form__field">
                <span>Robots</span>
                <select
                  value={form.robots || 'index,follow'}
                  onChange={(e) => setField('robots', e.target.value)}
                >
                  {ROBOTS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="seo-form__field">
                <span>Canonical URL</span>
                <input
                  value={form.canonicalUrl || ''}
                  onChange={(e) => setField('canonicalUrl', e.target.value)}
                  placeholder="https://www.drshahrooei.ir/"
                  dir="ltr"
                />
                <small>خالی = همان آدرس صفحه؛ برای جلوگیری از محتوای تکراری</small>
              </label>
            </div>

            <div className="seo-serp-preview" aria-hidden>
              <div className="seo-serp-preview__url">
                www.drshahrooei.ir{form.path === '/' ? '' : form.path}
              </div>
              <div className="seo-serp-preview__title">{previewTitle}</div>
              <div className="seo-serp-preview__desc">{previewDesc}</div>
            </div>
          </section>

          <section className="seo-form__section">
            <header className="seo-form__section-head">
              <h4>اشتراک‌گذاری (Open Graph)</h4>
              <p>وقتی لینک در واتساپ، تلگرام یا شبکه‌های اجتماعی باز می‌شود</p>
            </header>
            <div className="seo-form__grid">
              <label className="seo-form__field">
                <span>OG Title</span>
                <input
                  value={form.ogTitle || ''}
                  onChange={(e) => setField('ogTitle', e.target.value)}
                  placeholder="اگر خالی باشد همان Title استفاده می‌شود"
                />
              </label>
              <label className="seo-form__field seo-form__field--span2">
                <span>OG Description</span>
                <textarea
                  rows={2}
                  value={form.ogDescription || ''}
                  onChange={(e) => setField('ogDescription', e.target.value)}
                  placeholder="اگر خالی باشد همان Description استفاده می‌شود"
                />
              </label>
              <div className="seo-form__field seo-form__field--span2">
                <span className="seo-form__label-text">تصویر Open Graph</span>
                <HealanFileUpload value={ogFile} onChange={setOgFile} />
                <small>نسبت پیشنهادی حدود ۱۲۰۰×۶۳۰ پیکسل</small>
                {ogPreviewSrc ? (
                  <div className="seo-og-preview">
                    <img src={ogPreviewSrc} alt="پیش‌نمایش OG" />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="seo-form__section">
            <header className="seo-form__section-head">
              <h4>پیشرفته</h4>
              <p>فقط در صورت نیاز — JSON-LD اضافی برای اسکیماهای خاص</p>
            </header>
            <label className="seo-form__field">
              <span>JSON-LD اضافی (اختیاری)</span>
              <textarea
                rows={4}
                value={form.jsonLdExtra || ''}
                onChange={(e) => setField('jsonLdExtra', e.target.value)}
                dir="ltr"
                placeholder='[{"@type":"FAQPage", ...}]'
              />
              <small>باید JSON معتبر باشد؛ در صورت خطا نادیده گرفته می‌شود</small>
            </label>
          </section>
        </div>
      </HealanModal>
    </div>
  );
}

export default withAlert(SeoAdminPage);
