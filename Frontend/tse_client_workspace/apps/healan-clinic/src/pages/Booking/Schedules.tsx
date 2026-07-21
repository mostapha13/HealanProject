import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { DoctorSummary, ScheduleTemplateItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { JalaliDateInput } from '../../components/JalaliDateInput';

const DAY_LABELS: Record<string, string> = {
  '0': 'یکشنبه',
  '1': 'دوشنبه',
  '2': 'سه‌شنبه',
  '3': 'چهارشنبه',
  '4': 'پنجشنبه',
  '5': 'جمعه',
  '6': 'شنبه',
  Sunday: 'یکشنبه',
  Monday: 'دوشنبه',
  Tuesday: 'سه‌شنبه',
  Wednesday: 'چهارشنبه',
  Thursday: 'پنجشنبه',
  Friday: 'جمعه',
  Saturday: 'شنبه',
};

/** ترتیب هفته ایرانی: شنبه → جمعه */
const WEEK_DAYS = [6, 0, 1, 2, 3, 4, 5];

function resolveDayOfWeek(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim();
  if (raw in DAY_LABELS && /^\d+$/.test(raw)) return Number(raw);
  const named: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  if (raw in named) return named[raw];
  const n = Number(raw);
  return Number.isFinite(n) ? n : 6;
}

function dayTitle(value: unknown): string {
  const n = resolveDayOfWeek(value);
  return DAY_LABELS[String(n)] ?? String(value ?? '');
}

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => h); // 0..24

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function timeToHour(value: string): number {
  const raw = (value || '').trim();
  if (raw.startsWith('24')) return 24;
  const hour = Number(raw.split(':')[0]);
  return Number.isFinite(hour) ? Math.min(24, Math.max(0, hour)) : 0;
}

function hourToTime(hour: number): string {
  if (hour >= 24) return '24:00';
  return `${pad2(hour)}:00`;
}

function BookingSchedulesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [doctorId, setDoctorId] = useState(0);
  const [templates, setTemplates] = useState<ScheduleTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(0);
  const [form, setForm] = useState({
    dayOfWeek: 6,
    startHour: 17,
    endHour: 21,
    visitDurationMinutes: 30,
    isActive: true,
  });
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const doctorOptions = useMemo(
    () =>
      doctors.map((d) => ({
        value: d.doctorId,
        label: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || `پزشک ${d.doctorId}`,
      })),
    [doctors]
  );

  const load = async (id: number) => {
    if (!id) {
      setTemplates([]);
      return;
    }
    setLoading(true);
    try {
      const list = await healanApi.booking.templateList(id);
      setTemplates(list ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    healanApi.doctors
      .listAll()
      .then((list) => {
        setDoctors(list);
        if (list.length === 1) setDoctorId(list[0].doctorId);
      })
      .catch(onAlert);
  }, [onAlert]);

  useEffect(() => {
    void load(doctorId);
  }, [doctorId]);

  const resetForm = () => {
    setEditingId(0);
    setForm({
      dayOfWeek: 6,
      startHour: 17,
      endHour: 21,
      visitDurationMinutes: 30,
      isActive: true,
    });
  };

  const saveTemplate = async () => {
    if (!doctorId) {
      onAlert({ type: 'error', message: 'پزشک را انتخاب کنید.' });
      return;
    }
    if (form.endHour < form.startHour) {
      onAlert({ type: 'error', message: 'ساعت پایان نباید قبل از شروع باشد.' });
      return;
    }
    try {
      await healanApi.booking.templateSave({
        doctorScheduleTemplateId: editingId || 0,
        doctorId,
        dayOfWeek: form.dayOfWeek,
        startTime: hourToTime(form.startHour),
        endTime: hourToTime(form.endHour),
        visitDurationMinutes: form.visitDurationMinutes,
        isActive: form.isActive,
      });
      onAlert({ type: 'success', message: 'قالب برنامه ذخیره شد.' });
      resetForm();
      await load(doctorId);
    } catch (err) {
      onAlert(err);
    }
  };

  const editTemplate = (t: ScheduleTemplateItem) => {
    setEditingId(t.doctorScheduleTemplateId);
    setForm({
      dayOfWeek: resolveDayOfWeek(t.dayOfWeek),
      startHour: timeToHour(t.startTime),
      endHour: timeToHour(t.endTime),
      visitDurationMinutes: t.visitDurationMinutes || 30,
      isActive: t.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeTemplate = async (id: number) => {
    try {
      await healanApi.booking.templateDelete(id);
      if (editingId === id) resetForm();
      await load(doctorId);
    } catch (err) {
      onAlert(err);
    }
  };

  const copyTemplate = async () => {
    if (!doctorId || copyTargets.length === 0) {
      onAlert({ type: 'error', message: 'روز مبدأ و مقصد را مشخص کنید.' });
      return;
    }
    try {
      await healanApi.booking.templateCopy({
        doctorId,
        sourceDayOfWeek: form.dayOfWeek,
        targetDayOfWeeks: copyTargets,
      });
      onAlert({ type: 'success', message: 'قالب کپی شد.' });
      await load(doctorId);
    } catch (err) {
      onAlert(err);
    }
  };

  const generate = async () => {
    if (!doctorId || !fromDate || !toDate) {
      onAlert({ type: 'error', message: 'پزشک و بازه تاریخ لازم است.' });
      return;
    }
    setGenerating(true);
    try {
      const res = await healanApi.booking.generateSlots({ doctorId, fromDate, toDate });
      onAlert({ type: 'success', message: `${res.added ?? 0} اسلات ساخته شد.` });
    } catch (err) {
      onAlert(err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleCopyDay = (day: number) => {
    setCopyTargets((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]
    );
  };

  return (
    <>
      <PageHeader
        title="برنامه حضور پزشک"
        subtitle="قالب هفتگی ساعات حضور (۲۴ ساعته)، کپی به روزهای دیگر، و تولید اسلات با تاریخ شمسی"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>پزشک</label>
              <SearchableSelect
                options={doctorOptions}
                value={doctorId || null}
                onChange={(v) => setDoctorId(Number(v) || 0)}
                placeholder="انتخاب پزشک"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>{editingId ? 'ویرایش قالب روز' : 'ثبت قالب روز'}</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>روز هفته</label>
              <select
                className="healan-input"
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {dayTitle(day)}
                  </option>
                ))}
              </select>
            </div>
            <div className="healan-form-field">
              <label>از ساعت (۰–۲۴)</label>
              <select
                className="healan-input"
                value={form.startHour}
                onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })}
              >
                {HOUR_OPTIONS.filter((h) => h < 24).map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="healan-form-field">
              <label>تا ساعت (۰–۲۴)</label>
              <select
                className="healan-input"
                value={form.endHour}
                onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })}
              >
                {HOUR_OPTIONS.filter((h) => h > 0).map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="healan-form-field">
              <label>مدت ویزیت (دقیقه)</label>
              <input
                className="healan-input"
                type="number"
                min={5}
                max={180}
                value={form.visitDurationMinutes}
                onChange={(e) =>
                  setForm({ ...form, visitDurationMinutes: Number(e.target.value) || 30 })
                }
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="healan-btn healan-btn--primary" onClick={() => void saveTemplate()}>
              {editingId ? 'ذخیره تغییرات' : 'ذخیره قالب'}
            </button>
            {editingId > 0 && (
              <button type="button" className="healan-btn healan-btn--muted" onClick={resetForm}>
                انصراف از ویرایش
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>کپی قالب به روزهای دیگر</h3>
        </div>
        <div className="healan-card__body">
          <p className="healan-muted" style={{ marginBottom: '0.75rem' }}>
            روز مبدأ همان روز انتخاب‌شده در فرم بالاست. روزهای مقصد را تیک بزنید.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {WEEK_DAYS.map((day) => {
              if (day === form.dayOfWeek) return null;
              return (
                <label key={day} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={copyTargets.includes(day)}
                    onChange={() => toggleCopyDay(day)}
                  />
                  {dayTitle(day)}
                </label>
              );
            })}
          </div>
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => void copyTemplate()}>
            کپی قالب
          </button>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>تولید اسلات در بازه تاریخ (شمسی)</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>از تاریخ</label>
              <JalaliDateInput value={fromDate} onChange={setFromDate} placeholder="انتخاب از تاریخ" />
            </div>
            <div className="healan-form-field">
              <label>تا تاریخ</label>
              <JalaliDateInput value={toDate} onChange={setToDate} placeholder="انتخاب تا تاریخ" />
            </div>
          </div>
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            style={{ marginTop: '1rem' }}
            disabled={generating}
            onClick={() => void generate()}
          >
            {generating ? 'در حال تولید…' : 'تولید اسلات‌ها'}
          </button>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__header">
          <h3>قالب‌های ذخیره‌شده</h3>
        </div>
        <div className="healan-card__body">
          {!doctorId ? (
            <div className="healan-empty">برای مشاهده قالب‌ها، پزشک را انتخاب کنید.</div>
          ) : loading ? (
            <div className="healan-empty">در حال بارگذاری…</div>
          ) : templates.length === 0 ? (
            <div className="healan-empty">قالبی ثبت نشده است.</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>روز</th>
                  <th>از</th>
                  <th>تا</th>
                  <th>مدت</th>
                  <th>فعال</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {templates
                  .slice()
                  .sort((a, b) => WEEK_DAYS.indexOf(resolveDayOfWeek(a.dayOfWeek)) - WEEK_DAYS.indexOf(resolveDayOfWeek(b.dayOfWeek)))
                  .map((t) => (
                  <tr key={t.doctorScheduleTemplateId}>
                    <td>{dayTitle(t.dayOfWeek)}</td>
                    <td>{t.startTime}</td>
                    <td>{t.endTime}</td>
                    <td>{t.visitDurationMinutes} دقیقه</td>
                    <td>{t.isActive ? 'بله' : 'خیر'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="healan-btn healan-btn--action healan-btn--edit healan-btn--sm"
                          onClick={() => editTemplate(t)}
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm"
                          onClick={() => void removeTemplate(t.doctorScheduleTemplateId)}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(BookingSchedulesPage);
