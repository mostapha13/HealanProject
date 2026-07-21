import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalContentItem, PortalSectionType, PortalSiteSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanFileUpload, type FileUploadMeta } from '../../components/HealanFileUpload';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import { confirmDelete } from '../../components/confirmDialog';
import { DeletedItemsPanel } from '../../components/DeletedItemsPanel';

const SECTION_OPTIONS: { value: PortalSectionType; label: string }[] = [
  { value: 'HeroSlide', label: 'اسلاید هیرو' },
  { value: 'HeroStat', label: 'آمار هیرو' },
  { value: 'TrustBadge', label: 'نوار اعتماد' },
  { value: 'Service', label: 'خدمات' },
  { value: 'WhyUsFeature', label: 'چرا این مطب؟' },
  { value: 'AboutBlock', label: 'درباره' },
  { value: 'NavLink', label: 'منوی سایت' },
  { value: 'CustomSection', label: 'بخش سفارشی' },
];

const MANAGED_SECTIONS: { key: string; label: string }[] = [
  { key: 'HeroSlide', label: 'اسلایدر هیرو' },
  { key: 'HeroStat', label: 'آمار هیرو' },
  { key: 'TrustBadge', label: 'نوار اعتماد' },
  { key: 'Service', label: 'بخش خدمات' },
  { key: 'WhyUsFeature', label: 'چرا این مطب؟' },
  { key: 'NavLink', label: 'منوی سایت' },
  { key: 'about', label: 'بخش درباره پزشک' },
  { key: 'reviews', label: 'بخش نظرات بیماران' },
  { key: 'contact', label: 'بخش تماس' },
  { key: 'blog', label: 'بخش بلاگ' },
];

const SECTION_HINTS: Partial<Record<PortalSectionType, string>> = {
  HeroSlide: 'برای اسلاید قلب: iconName = heart. برای تصویر: از دکمه انتخاب تصویر استفاده کنید. عنوان = برچسب، زیرعنوان = متن bold.',
  HeroStat: 'عنوان = عدد/متن bold (مثلاً +۱۰)، زیرعنوان = توضیح کوتاه (مثلاً سال تجربه بالینی).',
  NavLink: 'لینک = شناسه بخش (about, services, reviews, why, contact).',
  Service: 'رنگ هگز، نام آیکون (IconStethoscope و...)، متن = توضیح خدمت.',
  TrustBadge: 'عنوان = برچسب اصلی، زیرعنوان = متن فرعی.',
};

const IMAGE_SECTION_TYPES: PortalSectionType[] = ['HeroSlide', 'Service', 'AboutBlock', 'CustomSection'];

const emptyForm = (): Omit<PortalContentItem, 'portalContentItemId'> & { portalContentItemId: number } => ({
  portalContentItemId: 0,
  sectionType: 'Service',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  imageFileId: '',
  iconName: '',
  linkUrl: '',
  color: '#ef394e',
  sortOrder: 0,
  isPublished: true,
});

function parseSectionEnabled(value: string | undefined): boolean {
  return value !== 'false' && value !== '0';
}

function SectionsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<PortalContentItem[]>([]);
  const [filter, setFilter] = useState<PortalSectionType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<FileUploadMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionSettings, setSectionSettings] = useState<Record<string, string>>({});
  const [togglingSection, setTogglingSection] = useState<string | null>(null);
  const { submitting, guard } = useAsyncSubmit();

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.contentList(filter ? { sectionType: filter } : {});
      setItems(res);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSectionSettings = async () => {
    try {
      const list = await healanApi.portal.settingList();
      const map: Record<string, string> = {};
      list.forEach((s) => {
        if (s.settingKey.startsWith('section.enabled.')) {
          map[s.settingKey.replace('section.enabled.', '')] = s.settingValue;
        }
      });
      setSectionSettings(map);
    } catch (err) {
      onAlert(err);
    }
  };

  useEffect(() => { void loadItems(); }, [filter]);
  useEffect(() => { void loadSectionSettings(); }, []);

  const sectionEnabled = useMemo(() => {
    const map: Record<string, boolean> = {};
    MANAGED_SECTIONS.forEach((s) => {
      map[s.key] = parseSectionEnabled(sectionSettings[s.key]);
    });
    return map;
  }, [sectionSettings]);

  const openNew = () => {
    setForm(emptyForm());
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (item: PortalContentItem) => {
    setForm({ ...item });
    setImageFile(
      item.imageFileId
        ? { fileId: item.imageFileId, fileName: 'تصویر', link: item.imageUrl }
        : null
    );
    setShowForm(true);
  };

  const handleSave = () => {
    void guard(async () => {
      if (!form.title?.trim() && !form.body?.trim()) {
        onAlert({ type: 'error', message: 'عنوان یا متن الزامی است' });
        return;
      }
      await healanApi.portal.contentRegister({
        portalContentItemId: form.portalContentItemId || undefined,
        sectionType: form.sectionType,
        title: form.title,
        subtitle: form.subtitle,
        body: form.body,
        imageUrl: imageFile?.link || form.imageUrl,
        imageFileId: imageFile?.fileId || undefined,
        iconName: form.iconName,
        linkUrl: form.linkUrl,
        color: form.color,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
      });
      setShowForm(false);
      await loadItems();
      onAlert({ type: 'success', message: 'مطلب ذخیره شد' });
    }).catch((err) => onAlert(err));
  };

  const handleToggleActive = async (item: PortalContentItem) => {
    try {
      await healanApi.portal.contentRegister({
        portalContentItemId: item.portalContentItemId,
        sectionType: item.sectionType,
        title: item.title,
        subtitle: item.subtitle,
        body: item.body,
        imageUrl: item.imageUrl,
        imageFileId: item.imageFileId,
        iconName: item.iconName,
        linkUrl: item.linkUrl,
        color: item.color,
        sortOrder: item.sortOrder,
        isPublished: !item.isPublished,
      });
      await loadItems();
      onAlert({
        type: 'success',
        message: item.isPublished ? 'مطلب غیرفعال شد' : 'مطلب فعال شد',
      });
    } catch (err) {
      onAlert(err);
    }
  };

  const handleToggleSection = async (key: string, label: string, enabled: boolean) => {
    setTogglingSection(key);
    try {
      const settings: PortalSiteSetting[] = [{
        portalSiteSettingId: 0,
        settingKey: `section.enabled.${key}`,
        settingValue: enabled ? 'true' : 'false',
        settingGroup: 'section',
        description: label,
      }];
      await healanApi.portal.settingSave(settings);
      setSectionSettings((prev) => ({ ...prev, [key]: enabled ? 'true' : 'false' }));
      onAlert({
        type: 'success',
        message: enabled ? `بخش «${label}» فعال شد` : `بخش «${label}» غیرفعال شد`,
      });
    } catch (err) {
      onAlert(err);
    } finally {
      setTogglingSection(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDelete('این مطلب حذف شود؟'))) return;
    try {
      await healanApi.portal.contentDelete(id);
      await loadItems();
      onAlert({ type: 'success', message: 'مطلب حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const sectionLabel = (type: PortalSectionType) =>
    SECTION_OPTIONS.find((o) => o.value === type)?.label ?? type;

  const formHint = SECTION_HINTS[form.sectionType];
  const showImageUpload = IMAGE_SECTION_TYPES.includes(form.sectionType);

  return (
    <>
      <PageHeader
        title="بخش‌ها و مطالب"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={openNew}>
            + مطلب جدید
          </button>
        }
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <h3 style={{ marginBottom: '0.75rem' }}>فعال / غیرفعال کردن بخش‌های سایت</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--healan-muted, #6b7280)', fontSize: '0.9rem' }}>
            با غیرفعال کردن یک بخش، کل آن قسمت در سایت مخفی می‌شود (بدون حذف مطالب).
          </p>
          <div className="healan-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {MANAGED_SECTIONS.map((section) => {
              const enabled = sectionEnabled[section.key] ?? true;
              return (
                <label
                  key={section.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--healan-border, #e5e7eb)',
                    borderRadius: 8,
                    background: enabled ? 'rgba(16, 185, 129, 0.06)' : 'rgba(156, 163, 175, 0.08)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={togglingSection === section.key}
                    onChange={(e) => void handleToggleSection(section.key, section.label, e.target.checked)}
                  />
                  <span>{section.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-field" style={{ maxWidth: 320 }}>
            <label>فیلتر بخش</label>
            <SearchableSelect
              value={filter}
              onChange={(v) => setFilter(v as PortalSectionType | null)}
              placeholder="همه بخش‌ها"
              options={SECTION_OPTIONS}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            {formHint && (
              <p style={{ marginBottom: '1rem', color: 'var(--healan-muted, #6b7280)', fontSize: '0.9rem' }}>
                {formHint}
              </p>
            )}
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>نوع بخش</label>
                <SearchableSelect
                  value={form.sectionType}
                  onChange={(v) => setForm({ ...form, sectionType: (v as PortalSectionType) ?? 'Service' })}
                  allowClear={false}
                  options={SECTION_OPTIONS}
                />
              </div>
              <div className="healan-form-field"><label>ترتیب</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} /></div>
              <div className="healan-form-field"><label>عنوان</label><input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="healan-form-field"><label>زیرعنوان</label><input value={form.subtitle ?? ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}><label>متن / توضیح</label><textarea rows={3} value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
              <div className="healan-form-field"><label>نام آیکون</label><input value={form.iconName ?? ''} onChange={(e) => setForm({ ...form, iconName: e.target.value })} placeholder="heart یا IconHeart" /></div>
              <div className="healan-form-field"><label>رنگ (خدمات)</label><input value={form.color ?? ''} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <div className="healan-form-field"><label>لینک / آدرس بخش</label><input value={form.linkUrl ?? ''} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="reviews یا https://..." /></div>
              {showImageUpload && (
                <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
                  <HealanFileUpload
                    label="تصویر (از سیستم / FileManager)"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.bmp"
                    value={imageFile}
                    onChange={setImageFile}
                    onError={onAlert}
                  />
                  {imageFile?.link && (
                    <img
                      src={imageFile.link}
                      alt="پیش‌نمایش"
                      style={{ marginTop: '0.75rem', maxWidth: 240, maxHeight: 140, borderRadius: 8, objectFit: 'cover' }}
                    />
                  )}
                </div>
              )}
              <div className="healan-form-field">
                <label>
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  {' '}فعال (نمایش در سایت)
                </label>
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={submitting} onClick={handleSave}>
                {submitting ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">مطلبی ثبت نشده</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>بخش</th>
                  <th>عنوان</th>
                  <th>ترتیب</th>
                  <th>وضعیت بخش</th>
                  <th>وضعیت مطلب</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const sectionOn = sectionEnabled[item.sectionType] ?? true;
                  return (
                  <tr key={item.portalContentItemId}>
                    <td>{sectionLabel(item.sectionType)}</td>
                    <td>
                      {item.title || item.body?.slice(0, 40) || '—'}
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          style={{ display: 'block', marginTop: 4, width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                    </td>
                    <td>{item.sortOrder}</td>
                    <td>
                      <span style={{ color: sectionOn ? '#10b981' : '#ef4444' }}>
                        {sectionOn ? 'بخش فعال' : 'بخش غیرفعال'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.isPublished ? '#10b981' : '#9ca3af' }}>
                        {item.isPublished ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="healan-btn healan-btn--action healan-btn--edit healan-btn--sm" onClick={() => openEdit(item)}>ویرایش</button>
                      {' '}
                      <button
                        type="button"
                        className={`healan-btn healan-btn--action healan-btn--sm ${item.isPublished ? 'healan-btn--unpublish' : 'healan-btn--publish'}`}
                        onClick={() => void handleToggleActive(item)}
                      >
                        {item.isPublished ? 'غیرفعال' : 'فعال'}
                      </button>
                      {' '}
                      <button type="button" className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm" onClick={() => void handleDelete(item.portalContentItemId)}>حذف</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <DeletedItemsPanel loadItems={healanApi.portal.contentDeletedList} restoreItem={healanApi.portal.contentRestore} onRestored={loadItems} onAlert={onAlert} />
    </>
  );
}

export default withAlert(SectionsPage);
