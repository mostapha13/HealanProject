import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { RagSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';

function AssistantSettingsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [settings, setSettings] = useState<RagSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.ragSettingGet();
      setSettings({
        ragSettingId: res.ragSettingId ?? 0,
        syncIntervalMinutes: res.syncIntervalMinutes ?? 30,
        similarityThresholdPercent: res.similarityThresholdPercent ?? 55,
        pythonApiUrl: res.pythonApiUrl ?? '',
        isEnabled: res.isEnabled ?? true,
        guestDailyLimit: res.guestDailyLimit ?? 10,
        authenticatedDailyLimit: res.authenticatedDailyLimit ?? 200,
        lastSyncedAt: res.lastSyncedAt,
      });
    } catch (err) {
      onAlert(err);
      setSettings({
        ragSettingId: 0,
        syncIntervalMinutes: 30,
        similarityThresholdPercent: 55,
        pythonApiUrl: '',
        isEnabled: true,
        guestDailyLimit: 10,
        authenticatedDailyLimit: 200,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await healanApi.portal.ragSettingSave(settings);
      setSettings({
        ragSettingId: saved.ragSettingId ?? settings.ragSettingId,
        syncIntervalMinutes: saved.syncIntervalMinutes ?? settings.syncIntervalMinutes,
        similarityThresholdPercent: saved.similarityThresholdPercent ?? settings.similarityThresholdPercent,
        pythonApiUrl: saved.pythonApiUrl ?? settings.pythonApiUrl,
        isEnabled: saved.isEnabled ?? settings.isEnabled,
        guestDailyLimit: saved.guestDailyLimit ?? settings.guestDailyLimit,
        authenticatedDailyLimit: saved.authenticatedDailyLimit ?? settings.authenticatedDailyLimit,
        lastSyncedAt: saved.lastSyncedAt ?? settings.lastSyncedAt,
      });
      onAlert({ type: 'success', message: 'تنظیمات دستیار ذخیره شد.' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="healan-empty">در حال بارگذاری…</div>;
  }

  return (
    <>
      <PageHeader
        title="تنظیمات دستیار هوشمند"
        subtitle="سقف سوالات روزانه مهمان و کاربر لاگین‌شده برای ربات پاسخ‌گوی سایت"
      />

      <div className="healan-card">
        <div className="healan-card__header">
          <h3>محدودیت سوالات روزانه</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>سقف سوال مهمان (روزانه)</label>
              <input
                className="healan-input"
                type="number"
                min={0}
                max={1000}
                value={settings.guestDailyLimit ?? 10}
                onChange={(e) =>
                  setSettings({ ...settings, guestDailyLimit: Number(e.target.value) })
                }
              />
              <small style={{ color: '#81858b' }}>بعد از این تعداد، کاربر باید با موبایل وارد شود.</small>
            </div>

            <div className="healan-form-field">
              <label>سقف سوال کاربر لاگین‌شده (روزانه)</label>
              <input
                className="healan-input"
                type="number"
                min={1}
                max={5000}
                value={settings.authenticatedDailyLimit ?? 200}
                onChange={(e) =>
                  setSettings({ ...settings, authenticatedDailyLimit: Number(e.target.value) })
                }
              />
            </div>

            <div className="healan-form-field">
              <label>
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                />{' '}
                ربات فعال باشد
              </label>
            </div>

            <div className="healan-form-field">
              <label>آستانه شباهت (درصد)</label>
              <input
                className="healan-input"
                type="number"
                min={1}
                max={100}
                value={settings.similarityThresholdPercent}
                onChange={(e) =>
                  setSettings({ ...settings, similarityThresholdPercent: Number(e.target.value) })
                }
              />
            </div>

            <div className="healan-form-field healan-form-field--full">
              <label>آدرس سرویس Python</label>
              <input
                className="healan-input"
                value={settings.pythonApiUrl ?? ''}
                onChange={(e) => setSettings({ ...settings, pythonApiUrl: e.target.value })}
                placeholder="http://python-rag:8000"
              />
            </div>

            {settings.lastSyncedAt && (
              <div className="healan-form-field">
                <label>آخرین همگام‌سازی</label>
                <div>{convertDateAndTimeToJalali(settings.lastSyncedAt)}</div>
              </div>
            )}
          </div>

          <div className="healan-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="healan-btn healan-btn--ghost" onClick={() => void load()}>
              بازخوانی
            </button>
            <button
              type="button"
              className="healan-btn healan-btn--primary"
              disabled={saving}
              onClick={() => void save()}
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AssistantSettingsPage);
