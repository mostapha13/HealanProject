import React, { useEffect, useState } from 'react';
import healanApi from '../api/healanApi';
import type { PatientVisitHistoryItem } from '../api/types';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { publicFileDownloadUrl } from '../api/fileApi';
import { openEchoPrintWindowBlank, writeEchoPrintHtmlToWindow } from '../utils/printEchoReport';
import { buildEchoPrintPayload } from '../utils/echoPrintPayload';

type Props = {
  patientId: number;
  patientName?: string;
  onAlert: (msg: unknown) => void;
  onClose: () => void;
};

export function PatientVisitHistoryDrawer({ patientId, patientName, onAlert, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PatientVisitHistoryItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    healanApi.patients
      .visitHistory(patientId)
      .then((res) => {
        if (!cancelled) setItems(res ?? []);
      })
      .catch(onAlert)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, onAlert]);

  const printEcho = async (prescriptionId: number) => {
    // باید پنجره در لحظه‌ی کلیک باز شود تا popup blocker فعال نشود.
    const w = openEchoPrintWindowBlank();
    if (!w) {
      onAlert({ type: 'error', message: 'پنجره چاپ باز نشد (Popup blocker). اجازه پنجره‌های جدید را فعال کن.' });
      return;
    }
    try {
      const data = await healanApi.prescriptions.echoPrintData(prescriptionId);
      writeEchoPrintHtmlToWindow(w, buildEchoPrintPayload({
        ...data,
        patientName: data.patientName || patientName || '',
      }));
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
      <div className="healan-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>سوابق ویزیت {patientName ? `— ${patientName}` : ''}</h3>
        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={onClose}>
          بستن
        </button>
      </div>
      <div className="healan-card__body">
        {loading ? (
          <div className="healan-empty">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="healan-empty">سابقه‌ای ثبت نشده است</div>
        ) : (
          items.map((visit) => {
            const open = expanded === visit.appointmentId;
            return (
              <div key={visit.appointmentId} className="healan-visit-history-item">
                <div className="healan-visit-history-item__head">
                  <div>
                    <strong>{convertDateAndTimeToJalali(visit.appointmentDate)}</strong>
                    <span style={{ marginInlineStart: '0.75rem', color: '#6b7280' }}>
                      {visit.doctorName ?? '—'} · {visit.appointmentStatus}
                    </span>
                  </div>
                  <div className="healan-actions">
                    {visit.hasEchoReport && visit.prescriptionId ? (
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        onClick={() => void printEcho(visit.prescriptionId!)}
                      >
                        چاپ اکو
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="healan-btn healan-btn--primary healan-btn--sm"
                      onClick={() => setExpanded(open ? null : visit.appointmentId)}
                    >
                      {open ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="healan-visit-history-item__body">
                    {!visit.prescriptionId ? (
                      <p style={{ color: '#6b7280' }}>برای این ویزیت نسخه‌ای ثبت نشده است.</p>
                    ) : (
                      <>
                        {visit.prescriptionNotes ? <p><strong>یادداشت:</strong> {visit.prescriptionNotes}</p> : null}
                        <h5>داروها</h5>
                        {visit.drugs?.length ? (
                          <ul>
                            {visit.drugs.map((d, i) => (
                              <li key={i}>{d.drugName} {d.dosage ? `— ${d.dosage}` : ''} {d.usageInstructions ? `(${d.usageInstructions})` : ''}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="healan-muted">دارویی ثبت نشده</p>
                        )}
                        <h5>آزمایش‌ها</h5>
                        {visit.labs?.length ? (
                          <ul>
                            {visit.labs.map((l, i) => (
                              <li key={i}>
                                {l.labTestType} {l.notes ? `— ${l.notes}` : ''}
                                {l.attachmentId ? (
                                  <> · <a href={publicFileDownloadUrl(l.attachmentId, l.attachmentLink)} target="_blank" rel="noreferrer">پیوست</a></>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="healan-muted">آزمایشی ثبت نشده</p>
                        )}
                        <h5>تصویربرداری</h5>
                        {visit.imaging?.length ? (
                          <ul>
                            {visit.imaging.map((img, i) => (
                              <li key={i}>
                                {img.imageTypeName} {img.notes ? `— ${img.notes}` : ''}
                                {img.attachmentId ? (
                                  <> · <a href={publicFileDownloadUrl(img.attachmentId, img.attachmentLink)} target="_blank" rel="noreferrer">پیوست</a></>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="healan-muted">تصویربرداری ثبت نشده</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
