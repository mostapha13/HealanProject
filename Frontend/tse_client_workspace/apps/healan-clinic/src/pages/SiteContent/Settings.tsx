import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalSiteSetting } from '../../api/types';
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

function SettingsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await healanApi.portal.settingList();
      const map: Record<string, string> = {};
      list.forEach((s) => { map[s.settingKey] = s.settingValue; });
      setValues(map);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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

  if (loading) return <div className="healan-empty">در حال بارگذاری...</div>;

  return (
    <>
      <PageHeader title="تنظیمات سایت" />
      <div className="healan-card">
        <div className="healan-card__body">
          <p style={{ marginBottom: '1.25rem', color: 'var(--healan-muted, #6b7280)', fontSize: '0.9rem' }}>
            آمار هیرو (+۱۰ سال...)، اسلایدر، نوار اعتماد، خدمات و... از منوی «بخش‌ها و مطالب» مدیریت می‌شوند.
          </p>
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
