import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { DoctorSummary, ScheduleTemplateItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';

const DAY_LABELS: Record<number, string> = {
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
  6: 'شنبه',
};

function BookingSchedulesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [doctorId, setDoctorId] = useState(0);
  const [templates, setTemplates] = useState<ScheduleTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dayOfWeek: 6,
    startTime: '17:00',
    endTime: '21:00',
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
    healanApi.doctors.listAll().then(setDoctors).catch(onAlert);
  }, [onAlert]);

  useEffect(() => {
    void load(doctorId);
  }, [doctorId]);

  const saveTemplate = async () => {
    if (!doctorId) {
      onAlert({ type: 'error', message: 'پزشک را انتخاب کنید.' });
      return;
    }
    try {
      await healanApi.booking.templateSave({
        doctorScheduleTemplateId: 0,
        doctorId,
        ...form,
      });
      onAlert({ type: 'success', message: 'قالب برنامه ذخیره شد.' });
      await load(doctorId);
    } catch (err) {
      onAlert(err);
    }
  };

  const removeTemplate = async (id: number) => {
    try {
      await healanApi.booking.templateDelete(id);
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
        subtitle="قالب هفتگی ساعات حضور، کپی به روزهای دیگر، و تولید اسلات در بازه تاریخ"
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
          <h3>ثبت / ویرایش قالب روز</h3>
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
                {Object.entries(DAY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="healan-form-field">
              <label>از ساعت</label>
              <input
                className="healan-input"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="healan-form-field">
              <label>تا ساعت</label>
              <input
                className="healan-input"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
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
              ذخیره قالب
            </button>
          </div>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>کپی قالب به روزهای دیگر</h3>
        </div>
        <div className="healan-card__body">
          <p style={{ marginBottom: '0.75rem', color: '#64748b' }}>
            روز مبدأ همان روز انتخاب‌شده در فرم بالاست. روزهای مقصد را تیک بزنید.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {Object.entries(DAY_LABELS).map(([k, v]) => {
              const day = Number(k);
              if (day === form.dayOfWeek) return null;
              return (
                <label key={k} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={copyTargets.includes(day)}
                    onChange={() => toggleCopyDay(day)}
                  />
                  {v}
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
          <h3>تولید اسلات در بازه تاریخ</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>از تاریخ</label>
              <input className="healan-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="healan-form-field">
              <label>تا تاریخ</label>
              <input className="healan-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
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
          {loading ? (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.doctorScheduleTemplateId}>
                    <td>{DAY_LABELS[t.dayOfWeek] ?? t.dayOfWeek}</td>
                    <td>{t.startTime}</td>
                    <td>{t.endTime}</td>
                    <td>{t.visitDurationMinutes} دقیقه</td>
                    <td>{t.isActive ? 'بله' : 'خیر'}</td>
                    <td>
                      <button
                        type="button"
                        className="healan-btn healan-btn--ghost healan-btn--sm"
                        onClick={() => void removeTemplate(t.doctorScheduleTemplateId)}
                      >
                        حذف
                      </button>
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
