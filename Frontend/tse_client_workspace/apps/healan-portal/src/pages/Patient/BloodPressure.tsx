import React, { useEffect, useState } from 'react';
import {
  patientBloodPressureDelete,
  patientBloodPressureList,
  patientBloodPressureSave,
  type PortalBloodPressureItem,
} from '../../api/portalApi';

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function asList(value: unknown): PortalBloodPressureItem[] {
  if (Array.isArray(value)) return value as PortalBloodPressureItem[];
  return [];
}

export default function PatientBloodPressurePage() {
  const [items, setItems] = useState<PortalBloodPressureItem[]>([]);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const list = await patientBloodPressureList();
    setItems(asList(list));
  };

  useEffect(() => {
    void reload().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'بارگذاری ناموفق بود')
    );
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await patientBloodPressureSave({
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        note: note.trim() || undefined,
        measuredAt: new Date().toISOString(),
      });
      setNote('');
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ثبت ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      await patientBloodPressureDelete(id);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portal-patient__panel">
      <h1 className="portal-patient__title">ثبت فشار خون</h1>
      <p className="portal-patient__lead">مقادیر فشار و نبض را برای پیگیری ثبت کنید.</p>
      {error && <div className="portal-patient__error">{error}</div>}

      <form className="portal-patient__form" onSubmit={save}>
        <label>
          سیستولیک
          <input value={systolic} onChange={(e) => setSystolic(e.target.value)} inputMode="numeric" required />
        </label>
        <label>
          دیاستولیک
          <input value={diastolic} onChange={(e) => setDiastolic(e.target.value)} inputMode="numeric" required />
        </label>
        <label>
          نبض (اختیاری)
          <input value={pulse} onChange={(e) => setPulse(e.target.value)} inputMode="numeric" />
        </label>
        <label className="portal-patient__form-wide">
          یادداشت
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
        <button type="submit" className="p-btn p-btn--primary" disabled={busy}>
          ذخیره
        </button>
      </form>

      <section className="portal-patient__section">
        <h2>سوابق ثبت‌شده</h2>
        {items.length === 0 ? (
          <p className="portal-patient__hint">هنوز رکوردی نیست.</p>
        ) : (
          <ul className="portal-patient__list">
            {items.map((item) => (
              <li key={item.id} className="portal-patient__list-row">
                <span>
                  <strong>
                    {item.systolic}/{item.diastolic}
                  </strong>
                  {item.pulse != null ? ` · نبض ${item.pulse}` : ''}
                  <span className="portal-patient__muted"> · {fmt(item.measuredAt)}</span>
                  {item.note ? <div className="portal-patient__muted">{item.note}</div> : null}
                </span>
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void remove(item.id)}>
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
