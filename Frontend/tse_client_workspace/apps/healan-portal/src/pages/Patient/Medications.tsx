import React, { useEffect, useMemo, useState } from 'react';
import {
  patientMedicationDelete,
  patientMedicationList,
  patientMedicationSave,
  type PortalMedicationItem,
} from '../../api/portalApi';
import { PatientPagedList } from './PatientPagedList';

const INTERVALS = [4, 6, 8, 10, 12, 24] as const;

function asList(value: unknown): PortalMedicationItem[] {
  if (Array.isArray(value)) return value as PortalMedicationItem[];
  return [];
}

function previewTimes(first: string, interval: number): string {
  if (!first || !interval) return '';
  const [hStr, mStr] = first.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const labels: string[] = [];
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + interval * 60 * 60 * 1000)) {
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    const sameDay = t.getDate() === start.getDate();
    labels.push(sameDay ? `${hh}:${mm}` : `${hh}:${mm} (روز بعد)`);
  }
  return labels.join('، ');
}

function formatStoredTimes(raw?: string) {
  if (!raw) return '';
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.endsWith('+1') ? `${p.slice(0, -2)} (روز بعد)` : p))
    .join('، ');
}

export default function PatientMedicationsPage() {
  const [items, setItems] = useState<PortalMedicationItem[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [interval, setInterval] = useState<number>(8);
  const [firstDose, setFirstDose] = useState('08:00');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => previewTimes(firstDose, interval), [firstDose, interval]);

  const reload = async () => {
    const list = await patientMedicationList();
    setItems(asList(list));
  };

  useEffect(() => {
    void reload().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'بارگذاری ناموفق بود')
    );
  }, []);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setDose('');
    setInterval(8);
    setFirstDose('08:00');
  };

  const startEdit = (item: PortalMedicationItem) => {
    setEditId(item.id);
    setName(item.medicationName);
    setDose(item.dose || '');
    setInterval(item.intervalHours && INTERVALS.includes(item.intervalHours as (typeof INTERVALS)[number])
      ? item.intervalHours
      : 8);
    setFirstDose(item.firstDoseTime || '08:00');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await patientMedicationSave({
        id: editId || undefined,
        medicationName: name.trim(),
        dose: dose.trim() || undefined,
        intervalHours: interval,
        firstDoseTime: firstDose,
        isActive: true,
      });
      resetForm();
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
        intervalHours: item.intervalHours || 8,
        firstDoseTime: item.firstDoseTime || '08:00',
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
      if (editId === id) resetForm();
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
        فاصله مصرف و ساعت اولین دوز را مشخص کنید؛ ساعات بعدی خودکار محاسبه می‌شوند.
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
        <label>
          هر چند ساعت
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {INTERVALS.map((n) => (
              <option key={n} value={n}>
                هر {n} ساعت
              </option>
            ))}
          </select>
        </label>
        <label>
          ساعت اولین مصرف
          <input type="time" value={firstDose} onChange={(e) => setFirstDose(e.target.value)} required />
        </label>
        {preview && (
          <p className="portal-patient__hint portal-patient__form-wide">ساعات محاسبه‌شده: {preview}</p>
        )}
        <div className="portal-patient__form-actions portal-patient__form-wide">
          <button type="submit" className="p-btn p-btn--success" disabled={busy}>
            {editId ? 'به‌روزرسانی' : 'افزودن'}
          </button>
          {editId != null && (
            <button type="button" className="p-btn p-btn--outline" disabled={busy} onClick={resetForm}>
              انصراف
            </button>
          )}
        </div>
      </form>

      <section className="portal-patient__section">
        <h2>لیست داروها</h2>
        <PatientPagedList
          items={items}
          emptyText="دارویی ثبت نشده است."
          getKey={(item) => item.id}
          renderItem={(item) => (
            <div className="portal-patient__list-row">
              <span>
                <strong>{item.medicationName}</strong>
                {item.dose ? ` · ${item.dose}` : ''}
                <div className="portal-patient__muted">
                  هر {item.intervalHours || '—'} ساعت از {item.firstDoseTime || '—'}
                  {item.isActive ? '' : ' · غیرفعال'}
                </div>
                <div className="portal-patient__muted">ساعات: {formatStoredTimes(item.timesOfDay)}</div>
              </span>
              <span className="portal-patient__row-actions">
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => startEdit(item)}>
                  ویرایش
                </button>
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void toggle(item)}>
                  {item.isActive ? 'غیرفعال' : 'فعال'}
                </button>
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void remove(item.id)}>
                  حذف
                </button>
              </span>
            </div>
          )}
        />
      </section>
    </div>
  );
}
