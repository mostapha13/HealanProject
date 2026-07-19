import React, { useEffect, useState } from 'react';
import {
  patientMedicationDelete,
  patientMedicationList,
  patientMedicationSave,
  type PortalMedicationItem,
} from '../../api/portalApi';

function asList(value: unknown): PortalMedicationItem[] {
  if (Array.isArray(value)) return value as PortalMedicationItem[];
  return [];
}

export default function PatientMedicationsPage() {
  const [items, setItems] = useState<PortalMedicationItem[]>([]);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState('08:00,20:00');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const list = await patientMedicationList();
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
      await patientMedicationSave({
        medicationName: name.trim(),
        dose: dose.trim() || undefined,
        timesOfDay: times,
        isActive: true,
      });
      setName('');
      setDose('');
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ثبت ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: PortalMedicationItem) => {
    setBusy(true);
    try {
      await patientMedicationSave({
        id: item.id,
        medicationName: item.medicationName,
        dose: item.dose || undefined,
        timesOfDay: item.timesOfDay,
        isActive: !item.isActive,
      });
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'به‌روزرسانی ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      await patientMedicationDelete(id);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portal-patient__panel">
      <h1 className="portal-patient__title">یادآوری داروها</h1>
      <p className="portal-patient__lead">
        دارو و ساعات مصرف را ثبت کنید (ارسال پیامک در نسخه بعدی اضافه می‌شود).
      </p>
      {error && <div className="portal-patient__error">{error}</div>}

      <form className="portal-patient__form" onSubmit={save}>
        <label>
          نام دارو
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <label>
          دوز
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="مثلاً ۵۰ میلی‌گرم" />
        </label>
        <label className="portal-patient__form-wide">
          ساعات روز (با ویرگول)
          <input value={times} onChange={(e) => setTimes(e.target.value)} placeholder="08:00,14:00,20:00" required />
        </label>
        <button type="submit" className="p-btn p-btn--primary" disabled={busy}>
          افزودن
        </button>
      </form>

      <section className="portal-patient__section">
        <h2>لیست داروها</h2>
        {items.length === 0 ? (
          <p className="portal-patient__hint">دارویی ثبت نشده است.</p>
        ) : (
          <ul className="portal-patient__list">
            {items.map((item) => (
              <li key={item.id} className="portal-patient__list-row">
                <span>
                  <strong>{item.medicationName}</strong>
                  {item.dose ? ` · ${item.dose}` : ''}
                  <div className="portal-patient__muted">
                    ساعات: {item.timesOfDay}
                    {item.isActive ? '' : ' · غیرفعال'}
                  </div>
                </span>
                <span className="portal-patient__row-actions">
                  <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void toggle(item)}>
                    {item.isActive ? 'غیرفعال' : 'فعال'}
                  </button>
                  <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void remove(item.id)}>
                    حذف
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
