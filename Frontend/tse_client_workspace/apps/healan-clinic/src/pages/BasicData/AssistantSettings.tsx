import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { RagSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';

const DEFAULT_EMBEDDING = 'heydariAI/persian-embeddings';
const DEFAULT_SUMMARIZE = 'qwen2.5:3b';
const DEFAULT_STT = 'small';

function emptySettings(): RagSetting {
  return {
    ragSettingId: 0,
    syncIntervalMinutes: 30,
    similarityThresholdPercent: 55,
    pythonApiUrl: '',
    isEnabled: true,
    guestDailyLimit: 10,
    authenticatedDailyLimit: 200,
    embeddingModel: DEFAULT_EMBEDDING,
    summarizeModel: DEFAULT_SUMMARIZE,
    sttModel: DEFAULT_STT,
    saveChatLogs: true,
  };
}

function mapSettings(res: Partial<RagSetting> | null | undefined, fallback?: RagSetting): RagSetting {
  const base = fallback ?? emptySettings();
  return {
    ragSettingId: res?.ragSettingId ?? base.ragSettingId,
    syncIntervalMinutes: res?.syncIntervalMinutes ?? base.syncIntervalMinutes,
    similarityThresholdPercent: res?.similarityThresholdPercent ?? base.similarityThresholdPercent,
    pythonApiUrl: res?.pythonApiUrl ?? base.pythonApiUrl,
    isEnabled: res?.isEnabled ?? base.isEnabled,
    guestDailyLimit: res?.guestDailyLimit ?? base.guestDailyLimit,
    authenticatedDailyLimit: res?.authenticatedDailyLimit ?? base.authenticatedDailyLimit,
    embeddingModel: (res?.embeddingModel || base.embeddingModel || DEFAULT_EMBEDDING).trim(),
    summarizeModel: (res?.summarizeModel || base.summarizeModel || DEFAULT_SUMMARIZE).trim(),
    sttModel: (res?.sttModel || base.sttModel || DEFAULT_STT).trim(),
    saveChatLogs: res?.saveChatLogs ?? base.saveChatLogs ?? true,
    lastSyncedAt: res?.lastSyncedAt ?? base.lastSyncedAt,
  };
}

function AssistantSettingsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [settings, setSettings] = useState<RagSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.ragSettingGet();
      setSettings(mapSettings(res));
    } catch (err) {
      onAlert(err);
      setSettings(emptySettings());
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
      setSettings(mapSettings(saved, settings));
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
        subtitle="سقف سوالات، مدل embedding، خلاصه‌ساز و گفتار به متن (Whisper)"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>مدل‌های هوش مصنوعی</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field healan-form-field--full">
              <label>مدل Embedding</label>
              <input
                className="healan-input"
                value={settings.embeddingModel ?? ''}
                onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
                placeholder={DEFAULT_EMBEDDING}
              />
              <small style={{ color: '#81858b' }}>
                برای جستجوی معنایی. نمونه: heydariAI/persian-embeddings یا simple
              </small>
            </div>

            <div className="healan-form-field healan-form-field--full">
              <label>مدل خلاصه‌ساز (بلاگ و نظرات)</label>
              <input
                className="healan-input"
                value={settings.summarizeModel ?? ''}
                onChange={(e) => setSettings({ ...settings, summarizeModel: e.target.value })}
                placeholder={DEFAULT_SUMMARIZE}
              />
              <small style={{ color: '#81858b' }}>
                پیش‌فرض رایگان لوکال: qwen2.5:3b (نیاز به Ollama روی سرور). بعد از تغییر، همگام‌سازی بعدی خلاصه را دوباره می‌سازد.
              </small>
            </div>

            <div className="healan-form-field healan-form-field--full">
              <label>مدل گفتار به متن (Whisper)</label>
              <input
                className="healan-input"
                value={settings.sttModel ?? ''}
                onChange={(e) => setSettings({ ...settings, sttModel: e.target.value })}
                placeholder={DEFAULT_STT}
              />
              <small style={{ color: '#81858b' }}>
                برای میکروفون ربات پورتال. نمونه‌ها: tiny (سریع/کم‌دقت)، base، small (پیشنهادی)، medium (دقیق‌تر/کندتر روی CPU).
                بعد از تغییر، اولین تبدیل ممکن است مدل را دوباره بارگذاری کند.
              </small>
            </div>
          </div>
        </div>
      </div>

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
              <label>
                <input
                  type="checkbox"
                  checked={settings.saveChatLogs !== false}
                  onChange={(e) => setSettings({ ...settings, saveChatLogs: e.target.checked })}
                />{' '}
                ذخیره سوال و جواب در «گفتگوهای دستیار»
              </label>
              <small style={{ color: '#81858b', display: 'block', marginTop: 4 }}>
                اگر خاموش باشد، مکالمات در لیست گفتگوها ثبت نمی‌شوند.
              </small>
            </div>

            <div className="healan-form-field">
              <label>فاصله همگام‌سازی دانش (دقیقه)</label>
              <input
                className="healan-input"
                type="number"
                min={1}
                max={1440}
                value={settings.syncIntervalMinutes ?? 30}
                onChange={(e) =>
                  setSettings({ ...settings, syncIntervalMinutes: Number(e.target.value) })
                }
              />
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
