import React, { useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import { PageHeader } from '../../components/Ui';

function SignaturePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [certificate, setCertificate] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const validate = async () => {
    try {
      const res = await healanApi.signature.validateCertificate({ certificateBase64: certificate });
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="امضای دیجیتال" subtitle="اعتبارسنجی گواهی امضا" />
      <div className="healan-card">
        <div className="healan-card__body">
          <div className="healan-form-field">
            <label>گواهی (Base64)</label>
            <textarea rows={6} value={certificate} onChange={(e) => setCertificate(e.target.value)} placeholder="محتوای گواهی را وارد کنید..." />
          </div>
          <div className="healan-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="healan-btn healan-btn--primary" onClick={validate}>اعتبارسنجی</button>
          </div>
          {result && (
            <pre style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: '0.8rem' }}>{result}</pre>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(SignaturePage);
