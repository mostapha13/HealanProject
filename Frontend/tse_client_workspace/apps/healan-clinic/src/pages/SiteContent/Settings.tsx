import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalContentItem, PortalSiteSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';

const SETTING_GROUPS: { group: string; label: string; fields: { key: string; label: string; multiline?: boolean }[] }[] = [
  {
    group: 'doctor',
    label: 'اطلاعات پزشک',
    fields: [
      { key: 'doctor.name', label: 'نام کامل' },
      { key: 'doctor.shortName', label: 'نام کوتاه' },
      { key: 'doctor.specialty', label: 'تخصص' },
      { key: 'doctor.board', label: 'بورد تخصصی', multiline: true },
      { key: 'doctor.general', label: 'تحصیلات عمومی', multiline: true },
    ],
  },
  {
    group: 'hero',
    label: 'بخش هیرو (بالای صفحه)',
    fields: [
      { key: 'hero.pill', label: 'برچسب کوچک (مراقبت تخصصی...)' },
      { key: 'hero.description', label: 'توضیح هیرو (با بورد تخصصی...)', multiline: true },
      { key: 'hero.float.title', label: 'کارت شناور — عنوان' },
      { key: 'hero.float.subtitle', label: 'کارت شناور — زیرعنوان' },
    ],
  },
  {
    group: 'section',
    label: 'عنوان بخش‌های صفحه',
    fields: [
      { key: 'section.about.badge', label: 'برچسب بخش درباره' },
      { key: 'section.about.title', label: 'عنوان بخش درباره' },
      { key: 'section.about.p1', label: 'پاراگراف اول درباره', multiline: true },
      { key: 'section.about.p2', label: 'پاراگراف دوم درباره', multiline: true },
      { key: 'section.why.title', label: 'عنوان «چرا این مطب؟»' },
      { key: 'section.why.subtitle', label: 'زیرعنوان «چرا این مطب؟»', multiline: true },
      { key: 'section.services.title', label: 'عنوان خدمات' },
      { key: 'section.services.subtitle', label: 'زیرعنوان خدمات', multiline: true },
      { key: 'section.reviews.title', label: 'عنوان نظرات بیماران' },
      { key: 'section.reviews.subtitle', label: 'زیرعنوان نظرات', multiline: true },
      { key: 'section.contact.title', label: 'عنوان تماس' },
      { key: 'section.contact.lead', label: 'متن راهنمای تماس', multiline: true },
      { key: 'section.contact.hint', label: 'راهنمای ورود به سامانه', multiline: true },
    ],
  },
  {
    group: 'contact',
    label: 'تماس و آدرس',
    fields: [
      { key: 'contact.address', label: 'آدرس', multiline: true },
      { key: 'contact.city', label: 'شهر' },
      { key: 'contact.phone', label: 'تلفن (لاتین)' },
      { key: 'contact.phoneDisplay', label: 'نمایش تلفن' },
      { key: 'contact.hours', label: 'ساعات کاری', multiline: true },
    ],
  },
  {
    group: 'map',
    label: 'کارت نقشه',
    fields: [
      { key: 'map.header', label: 'عنوان کارت نقشه' },
      { key: 'map.building', label: 'نام ساختمان' },
      { key: 'map.detail', label: 'جزئیات آدرس' },
      { key: 'map.link', label: 'لینک نقشه (Google Maps)' },
    ],
  },
  {
    group: 'site',
    label: 'سایت',
    fields: [
      { key: 'site.topbar', label: 'نوار بالای سایت' },
      { key: 'about.quote', label: 'جمله درباره پزشک', multiline: true },
    ],
  },
];

const EMPTY_STAT = {
  portalContentItemId: 0,
  title: '',
  subtitle: '',
  sortOrder: 0,
  isPublished: true,
};

function SettingsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroStats, setHeroStats] = useState<PortalContentItem[]>([]);
  const [heroSectionEnabled, setHeroSectionEnabled] = useState(true);
  const [showStatForm, setShowStatForm] = useState(false);
  const [statForm, setStatForm] = useState(EMPTY_STAT);
  const [savingStat, setSavingStat] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, content] = await Promise.all([
        healanApi.portal.settingList(),
        healanApi.portal.contentList({ sectionType: 'HeroStat' }),
      ]);
      const map: Record<string, string> = {};
      list.forEach((s) => {
        map[s.settingKey] = s.settingValue;
      });
      setValues(map);
      setHeroSectionEnabled(map['section.enabled.HeroStat'] !== 'false' && map['section.enabled.HeroStat'] !== '0');
      setHeroStats(
        [...content].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.portalContentItemId - b.portalContentItemId)
      );
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: PortalSiteSetting[] = [];
      SETTING_GROUPS.forEach((g) => {
        g.fields.forEach((field) => {
          settings.push({
            portalSiteSettingId: 0,
            settingKey: field.key,
            settingValue: values[field.key] ?? '',
            settingGroup: g.group,
            description: field.label,
          });
        });
      });
      await healanApi.portal.settingSave(settings);
      onAlert({ type: 'success', message: 'تنظیمات ذخیره شد' });
      await load();
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHeroSection = async () => {
    const next = !heroSectionEnabled;
    try {
      await healanApi.portal.settingSave([
        {
          portalSiteSettingId: 0,
          settingKey: 'section.enabled.HeroStat',
          settingValue: next ? 'true' : 'false',
          settingGroup: 'section',
          description: 'آمار هیرو',
        },
      ]);
      setHeroSectionEnabled(next);
      onAlert({
        type: 'success',
        message: next ? 'آمار هیرو فعال شد' : 'آمار هیرو غیرفعال شد',
      });
    } catch (err) {
      onAlert(err);
    }
  };

  const openNewStat = () => {
    setStatForm({
      ...EMPTY_STAT,
      sortOrder: heroStats.length,
    });
    setShowStatForm(true);
  };

  const openEditStat = (item: PortalContentItem) => {
    setStatForm({
      portalContentItemId: item.portalContentItemId,
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      sortOrder: item.sortOrder ?? 0,
      isPublished: item.isPublished !== false,
    });
    setShowStatForm(true);
  };

  const handleSaveStat = async () => {
    if (!statForm.title.trim()) {
      onAlert({ type: 'error', message: 'عنوان آمار (مثلاً +۱۰) الزامی است' });
      return;
    }
    setSavingStat(true);
    try {
      await healanApi.portal.contentRegister({
        portalContentItemId: statForm.portalContentItemId || undefined,
        sectionType: 'HeroStat',
        title: statForm.title.trim(),
        subtitle: statForm.subtitle.trim(),
        sortOrder: Number(statForm.sortOrder) || 0,
        isPublished: statForm.isPublished,
      });
      setShowStatForm(false);
      await load();
      onAlert({ type: 'success', message: 'آمار هیرو ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSavingStat(false);
    }
  };

  const handleToggleStat = async (item: PortalContentItem) => {
    try {
      await healanApi.portal.contentRegister({
        portalContentItemId: item.portalContentItemId,
        sectionType: 'HeroStat',
        title: item.title,
        subtitle: item.subtitle,
        body: item.body,
        sortOrder: item.sortOrder,
        isPublished: !item.isPublished,
      });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const handleDeleteStat = async (id: number) => {
    if (!window.confirm('این آمار حذف شود؟')) return;
    try {
      await healanApi.portal.contentDelete(id);
      await load();
      onAlert({ type: 'success', message: 'آمار حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  if (loading) return <div className="healan-empty">در حال بارگذاری...</div>;

  return (
    <>
      <PageHeader title="تنظیمات سایت" />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>آمار هیرو (بالای صفحه)</h3>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--healan-muted, #6b7280)', fontSize: '0.85rem' }}>
                عنوان = عدد/متن برجسته (مثلاً +۱۰) — زیرعنوان = توضیح (مثلاً سال تجربه بالینی)
              </p>
            </div>
            <div className="healan-actions">
              <button
                type="button"
                className={`healan-btn healan-btn--sm healan-btn--action ${
                  heroSectionEnabled ? 'healan-btn--unpublish' : 'healan-btn--publish'
                }`}
                onClick={() => void handleToggleHeroSection()}
              >
                {heroSectionEnabled ? 'غیرفعال کردن بخش' : 'فعال کردن بخش'}
              </button>
              <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={openNewStat}>
                + افزودن آمار
              </button>
            </div>
          </div>

          {heroStats.length === 0 ? (
            <div className="healan-empty">هنوز آماری ثبت نشده — با «افزودن آمار» سه مورد پیشنهادی را بسازید.</div>
          ) : (
            <div className="healan-table-wrap">
              <table className="healan-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>زیرعنوان</th>
                    <th>ترتیب</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {heroStats.map((item) => (
                    <tr key={item.portalContentItemId}>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td>{item.subtitle || '—'}</td>
                      <td>{item.sortOrder ?? 0}</td>
                      <td>
                        <span className={`healan-badge ${item.isPublished ? 'healan-badge--success' : 'healan-badge--muted'}`}>
                          {item.isPublished ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td>
                        <div className="healan-actions">
                          <button
                            type="button"
                            className="healan-btn healan-btn--sm healan-btn--action healan-btn--edit"
                            onClick={() => openEditStat(item)}
                          >
                            <span aria-hidden>✎</span>
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className={`healan-btn healan-btn--sm healan-btn--action ${
                              item.isPublished ? 'healan-btn--unpublish' : 'healan-btn--publish'
                            }`}
                            onClick={() => void handleToggleStat(item)}
                          >
                            {item.isPublished ? 'غیرفعال' : 'فعال'}
                          </button>
                          <button
                            type="button"
                            className="healan-btn healan-btn--sm healan-btn--action healan-btn--danger"
                            onClick={() => void handleDeleteStat(item.portalContentItemId)}
                          >
                            <span aria-hidden>🗑</span>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showStatForm && (
            <div className="healan-form-grid" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <div className="healan-form-field">
                <label>عنوان (مثلاً +۱۰)</label>
                <input
                  value={statForm.title}
                  onChange={(e) => setStatForm({ ...statForm, title: e.target.value })}
                  placeholder="+۱۰"
                />
              </div>
              <div className="healan-form-field">
                <label>زیرعنوان (مثلاً سال تجربه بالینی)</label>
                <input
                  value={statForm.subtitle}
                  onChange={(e) => setStatForm({ ...statForm, subtitle: e.target.value })}
                  placeholder="سال تجربه بالینی"
                />
              </div>
              <div className="healan-form-field">
                <label>ترتیب</label>
                <input
                  type="number"
                  value={statForm.sortOrder}
                  onChange={(e) => setStatForm({ ...statForm, sortOrder: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="healan-form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={statForm.isPublished}
                    onChange={(e) => setStatForm({ ...statForm, isPublished: e.target.checked })}
                  />{' '}
                  فعال / نمایش در سایت
                </label>
              </div>
              <div className="healan-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="healan-btn healan-btn--primary" disabled={savingStat} onClick={() => void handleSaveStat()}>
                  {savingStat ? 'در حال ذخیره...' : 'ذخیره آمار'}
                </button>
                <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowStatForm(false)}>
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__body">
          {SETTING_GROUPS.map((group) => (
            <div key={group.group} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>{group.label}</h3>
              <div className="healan-form-grid">
                {group.fields.map((field) => (
                  <div key={field.key} className="healan-form-field" style={field.multiline ? { gridColumn: '1 / -1' } : undefined}>
                    <label>{field.label}</label>
                    {field.multiline ? (
                      <textarea
                        rows={3}
                        value={values[field.key] ?? ''}
                        onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        value={values[field.key] ?? ''}
                        onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="healan-actions">
            <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(SettingsPage);
