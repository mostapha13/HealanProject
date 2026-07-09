import React from 'react';
import { ECHO_SECTIONS, type EchoReportForm } from '../utils/echoFields';

type Props = {
  value: EchoReportForm;
  onChange: (next: EchoReportForm) => void;
};

export function EchoReportFormPanel({ value, onChange }: Props) {
  const setField = (key: keyof EchoReportForm, fieldValue: string) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="healan-prescription-panel healan-echo-panel">
      <h4 className="healan-prescription-panel__title">گزارش اکوکاردیوگرافی (همه فیلدها اختیاری)</h4>
      <div className="healan-form-field" style={{ marginBottom: '0.75rem' }}>
        <label>PHM / سابقه</label>
        <input value={value.phm} onChange={(e) => setField('phm', e.target.value)} placeholder="سابقه بیمار" />
      </div>

      <div className="healan-echo-grid">
        {ECHO_SECTIONS.map((section) => (
          <div key={section.title} className="healan-echo-section">
            <div className="healan-echo-section__title">{section.title}</div>
            <table className="healan-table healan-echo-table">
              <thead>
                <tr>
                  <th>اندازه‌گیری</th>
                  <th>مقدار</th>
                  <th>محدوده</th>
                </tr>
              </thead>
              <tbody>
                {section.fields.map((field) => (
                  <tr key={field.key}>
                    <td>{field.label}</td>
                    <td>
                      <input
                        value={value[field.key]}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                    <td className="healan-echo-range">{field.range || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="healan-form-field" style={{ marginTop: '0.75rem' }}>
        <label>Conclusion</label>
        <textarea rows={3} value={value.conclusion} onChange={(e) => setField('conclusion', e.target.value)} />
      </div>
      <div className="healan-form-field" style={{ marginTop: '0.75rem' }}>
        <label>Recommendation</label>
        <textarea rows={3} value={value.recommendation} onChange={(e) => setField('recommendation', e.target.value)} />
      </div>
    </div>
  );
}
