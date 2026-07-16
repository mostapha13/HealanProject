import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { SmsSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

function SmsSettingsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SmsSetting | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [templateId, setTemplateId] = useState(640023);
  const [lineNumber, setLineNumber] = useState(0);
  const [sendEnabled, setSendEnabled] = useState(true);
  const { submitting, guard } = useAsyncSubmit();

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.reports.smsSettingsGet();
      setSettings(res);
      setApiKeyInput('');
      setTemplateId(res.templateId ?? 640023);
      setLineNumber(Number(res.lineNumber ?? 0));
      setSendEnabled(Boolean(res.sendEnabled));
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = () => {
    void guard(async () => {
      const payload: {
        apiKey?: string;
        templateId: number;
        lineNumber: number;
        verifyParameterName: string;
        sendEnabled: boolean;
      } = {
        templateId: Number(templateId) || 640023,
        lineNumber: Number(lineNumber) || 0,
        verifyParameterName: 'Code',
        sendEnabled,
      };
      if (apiKeyInput.trim() && !apiKeyInput.includes('*')) {
        payload.apiKey = apiKeyInput.trim();
      }

      const saved = await healanApi.reports.smsSettingsSave(payload);
      setSettings(saved);
      setApiKeyInput('');
      onAlert({ type: 'success', message: 'تنظیمات پیامک ذخیره شد' });
    }).catch((err) => onAlert(err));
  };

  if (loading) {
    return <div className="healan-empty">در حال بارگذاری...</div>;
  }

  return (
    <>
      <PageHeader
        title="تنظیمات پیامک"
        subtitle="ApiKey و قالب sms.ir — ارسال واقعی را می‌توانید خاموش کنید؛ گزارش همیشه ثبت می‌شود"
      />

      <div className="healan-card">
        <div className="healan-card__body" style={{ display: 'grid', gap: '1rem', maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>ApiKey فعلی</span>
            <input
              dir="ltr"
              value={settings?.apiKeyMasked ?? ''}
              readOnly
              style={{ opacity: 0.85 }}
            />
            <small style={{ color: 'var(--healan-text-muted)' }}>
              برای تغییر، کلید جدید را پایین وارد کنید (در غیر این صورت همان کلید قبلی حفظ می‌شود)
            </small>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>ApiKey جدید (اختیاری)</span>
            <input
              dir="ltr"
              type="password"
              autoComplete="off"
              placeholder="فقط در صورت تغییر پر کنید"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>TemplateId (قالب Verify)</span>
            <input
              dir="ltr"
              type="number"
              value={templateId}
              onChange={(e) => setTemplateId(Number(e.target.value))}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>LineNumber (ارسال آزاد)</span>
            <input
              dir="ltr"
              type="number"
              value={lineNumber}
              onChange={(e) => setLineNumber(Number(e.target.value))}
            />
            <small style={{ color: 'var(--healan-text-muted)' }}>
              مقدار ۰ یعنی استفاده از خط پیش‌فرض پنل (در صورت وجود)
            </small>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={sendEnabled}
              onChange={(e) => setSendEnabled(e.target.checked)}
            />
            <span>ارسال واقعی به پنل sms.ir فعال باشد</span>
          </label>
          <p style={{ margin: 0, color: 'var(--healan-text-muted)', fontSize: '0.85rem' }}>
            اگر خاموش باشد، پیامک به موبایل نمی‌رود ولی در «پیامک‌های ارسالی» با کانال Disabled ثبت می‌شود.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="healan-btn healan-btn--primary"
              disabled={submitting}
              onClick={handleSave}
            >
              {submitting ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => void load()}>
              بازنشانی
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(SmsSettingsPage);
