import { ECHO_SECTIONS, type EchoReportForm } from '../utils/echoFields';

const CLINIC = {
  name: 'کلینیک قلب و عروق دکتر معصومه شهرویی',
  doctor: 'دکتر معصومه شهرویی',
  specialty: 'متخصص قلب و عروق',
  address:
    'شوشتر، خیابان طالقانی، پایین‌تر از خیابان سادات، ساختمان پزشکان دکتر جلالی (آزمایشگاه سلامت)، طبقه دوم واحد ۲',
  phone: '۰۹۰۲۵۱۰۳۸۶۷',
  instagram: '@dr.masumehshahrooei',
  website: 'www.drshahrooei.ir',
} as const;

export type EchoPrintPayload = {
  patientName: string;
  patientNationalCode?: string | null;
  patientBirthdate?: string | null;
  patientAge?: string | null;
  examDate: string;
  echo: EchoReportForm;
};

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function measureTable(
  title: string,
  fields: { label: string; range: string; key: keyof EchoReportForm }[],
  echo: EchoReportForm
): string {
  const rows = fields
    .map(
      (f) => `<tr>
        <td class="lbl">${esc(f.label)}</td>
        <td class="val">${esc(echo[f.key]) || '&nbsp;'}</td>
        <td class="rng">${esc(f.range) || '—'}</td>
      </tr>`
    )
    .join('');

  return `<section class="block">
    <div class="block-title">${esc(title)}</div>
    <table class="m">
      <thead>
        <tr><th>Measurement</th><th>Value</th><th>Range</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

export function buildEchoPrintHtml(data: EchoPrintPayload): string {
  const { echo } = data;
  const tables = ECHO_SECTIONS.map((s) => measureTable(s.title, s.fields, echo)).join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گزارش اکوکاردیوگرافی — ${esc(data.patientName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 210mm;
      height: 297mm;
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      color: #1a1a2e;
      background: #e8eaed;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      display: flex;
      justify-content: center;
      padding: 6px 0;
    }

    .page {
      width: 210mm;
      height: 297mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      box-shadow: 0 2px 16px rgba(0,0,0,.12);
    }

    /* ── Header ── */
    .header {
      padding: 4mm 7mm 2.5mm;
      border-bottom: 2.5px solid #b91c1c;
      text-align: center;
      flex-shrink: 0;
    }

    .header-clinic {
      font-size: 14px;
      font-weight: 800;
      color: #1a1a2e;
      letter-spacing: -0.2px;
      margin-bottom: 2px;
    }

    .header-title-fa {
      font-size: 15px;
      font-weight: 800;
      color: #b91c1c;
      margin: 1px 0;
    }

    .header-title-en {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      direction: ltr;
      letter-spacing: 0.3px;
    }

    /* ── Patient meta ── */
    .meta {
      display: grid;
      grid-template-columns: 1.4fr 0.9fr 0.9fr 0.6fr 1fr;
      gap: 3px 8px;
      padding: 2mm 7mm;
      background: #fafbfc;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
      font-size: 10px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      min-height: 18px;
    }

    .meta-item--full {
      grid-column: 1 / -1;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
      white-space: nowrap;
      direction: ltr;
      font-size: 9.5px;
    }

    .meta-value {
      flex: 1;
      border-bottom: 1px solid #94a3b8;
      min-height: 16px;
      padding: 0 4px 2px;
      font-weight: 600;
      color: #0f172a;
      font-size: 10px;
    }

    .meta-value--fa {
      direction: rtl;
      text-align: right;
    }

    /* ── Tables grid ── */
    .content {
      flex: 1;
      padding: 1.5mm 5mm 1mm;
      overflow: hidden;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3px 4px;
    }

    .block {
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      overflow: hidden;
      background: #fff;
    }

    .block-title {
      background: linear-gradient(180deg, #f1f5f9 0%, #e8edf3 100%);
      font-weight: 700;
      font-size: 9px;
      padding: 2px 5px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
      direction: ltr;
      color: #334155;
      letter-spacing: 0.2px;
    }

    table.m {
      width: 100%;
      border-collapse: collapse;
      direction: ltr;
      text-align: left;
      table-layout: fixed;
    }

    table.m th {
      background: #f8fafc;
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      padding: 2px 4px;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    table.m td {
      font-size: 8.5px;
      padding: 1.5px 4px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      line-height: 1.35;
    }

    table.m tr:last-child td { border-bottom: none; }

    table.m .lbl {
      color: #334155;
      font-weight: 600;
      width: 36%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    table.m .val {
      font-weight: 700;
      color: #0f172a;
      width: 30%;
      text-align: center;
      font-size: 9px;
    }

    table.m .rng {
      color: #64748b;
      font-size: 7.8px;
      width: 34%;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Conclusion row (right under tables) ── */
    .notes-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-top: 3px;
      flex-shrink: 0;
    }

    .note-box {
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      min-height: 18mm;
      max-height: 20mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .note-box__title {
      background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
      color: #b91c1c;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-bottom: 1px solid #fecaca;
      direction: ltr;
      text-align: left;
      letter-spacing: 0.3px;
    }

    .note-box__body {
      flex: 1;
      padding: 3px 7px;
      font-size: 9.5px;
      line-height: 1.4;
      color: #1e293b;
      white-space: pre-wrap;
      direction: ltr;
      text-align: left;
      overflow: hidden;
    }

    /* ── Footer: stamp + signature + clinic info ── */
    .footer {
      flex-shrink: 0;
      margin-top: auto;
      position: relative;
    }

    .footer-body {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 4mm 7mm 2mm;
      gap: 5mm;
      position: relative;
      z-index: 2;
    }

    .footer-auth {
      display: flex;
      align-items: flex-end;
      gap: 5mm;
      flex-shrink: 0;
    }

    .footer-stamp {
      width: 28mm;
      height: 28mm;
      flex-shrink: 0;
    }

    .footer-sign {
      min-width: 42mm;
      text-align: center;
      flex-shrink: 0;
      padding-bottom: 1mm;
    }

    .footer-sign__label {
      font-size: 8.5px;
      color: #64748b;
      direction: ltr;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .footer-sign__name {
      font-size: 11px;
      font-weight: 800;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .footer-sign__line {
      border-top: 1.5px solid #334155;
      width: 100%;
      margin: 0 auto;
    }

    .footer-sign__title {
      font-size: 8px;
      color: #64748b;
      margin-top: 3px;
    }

    .footer-info {
      flex: 1;
      text-align: right;
      font-size: 8.5px;
      line-height: 1.5;
      color: #475569;
      padding-bottom: 1mm;
    }

    .footer-info strong {
      display: block;
      font-size: 9.5px;
      font-weight: 800;
      color: #b91c1c;
      margin-bottom: 2px;
    }

    .footer-info .address {
      font-size: 8px;
      line-height: 1.45;
    }

    .footer-contacts {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 2px 10px;
      margin-top: 3px;
      font-size: 8.5px;
      font-weight: 600;
      color: #334155;
    }

    .footer-contacts span {
      direction: ltr;
      unicode-bidi: embed;
    }

    .footer-contacts .sep {
      color: #cbd5e1;
      font-weight: 400;
    }

    .footer-wave {
      height: 12px;
      width: 100%;
      display: block;
    }

    /* ── Print toolbar ── */
    .no-print {
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999;
      display: flex;
      gap: 8px;
    }

    .no-print button {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #b91c1c;
      color: #fff;
      box-shadow: 0 2px 8px rgba(185,28,28,.3);
    }

    .no-print button:hover { background: #991b1b; }

    @media print {
      html, body {
        background: #fff;
        padding: 0;
        width: 210mm;
        height: 297mm;
      }
      body { display: block; }
      .page {
        box-shadow: none;
        width: 210mm;
        height: 297mm;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">🖨 چاپ گزارش</button>
  </div>

  <div class="page">
    <header class="header">
      <div class="header-clinic">${esc(CLINIC.name)}</div>
      <div class="header-title-fa">گزارش اکوکاردیوگرافی کامل قلب</div>
      <div class="header-title-en">Echocardiography, M-mode · 2D · Color Doppler</div>
    </header>

    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">Name:</span>
        <span class="meta-value meta-value--fa">${esc(data.patientName)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date:</span>
        <span class="meta-value">${esc(data.examDate)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">DOB:</span>
        <span class="meta-value meta-value--fa">${esc(data.patientBirthdate) || '—'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Age:</span>
        <span class="meta-value">${data.patientAge ? esc(data.patientAge) + ' Y' : '—'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">ID:</span>
        <span class="meta-value">${esc(data.patientNationalCode) || '—'}</span>
      </div>
      <div class="meta-item meta-item--full">
        <span class="meta-label">PHM:</span>
        <span class="meta-value meta-value--fa">${esc(echo.phm) || '—'}</span>
      </div>
    </div>

    <div class="content">
      <div class="grid">${tables}</div>
      <div class="notes-row">
        <div class="note-box">
          <div class="note-box__title">Conclusion</div>
          <div class="note-box__body">${esc(echo.conclusion) || '—'}</div>
        </div>
        <div class="note-box">
          <div class="note-box__title">Recommendation</div>
          <div class="note-box__body">${esc(echo.recommendation) || '—'}</div>
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="footer-body">
        <div class="footer-auth">
          <div class="footer-stamp" aria-hidden="true"></div>
          <div class="footer-sign">
            <div class="footer-sign__label">Signature</div>
            <div class="footer-sign__name">${esc(CLINIC.doctor)}</div>
            <div class="footer-sign__line"></div>
            <div class="footer-sign__title">${esc(CLINIC.specialty)}</div>
          </div>
        </div>
        <div class="footer-info">
          <strong>${esc(CLINIC.name)}</strong>
          <div class="address">${esc(CLINIC.address)}</div>
          <div class="footer-contacts">
            <span>تلفن مطب: ${esc(CLINIC.phone)}</span>
            <span class="sep">|</span>
            <span>اینستاگرام: ${esc(CLINIC.instagram)}</span>
            <span class="sep">|</span>
            <span>${esc(CLINIC.website)}</span>
          </div>
        </div>
      </div>
      <svg class="footer-wave" viewBox="0 0 800 14" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,14 L0,6 Q100,0 200,6 T400,6 T600,6 T800,6 L800,14 Z" fill="#b91c1c"/>
        <path d="M0,14 L0,9 Q100,4 200,9 T400,9 T600,9 T800,9 L800,14 Z" fill="#dc2626" opacity="0.7"/>
        <path d="M0,14 L0,11 Q100,8 200,11 T400,11 T600,11 T800,11 L800,14 Z" fill="#ef4444" opacity="0.4"/>
      </svg>
    </footer>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;
}

export function openEchoPrintWindowBlank(): Window | null {
  return window.open('', '_blank', 'width=900,height=1100');
}

export function writeEchoPrintHtmlToWindow(w: Window, data: EchoPrintPayload) {
  const html = buildEchoPrintHtml(data);
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function openEchoPrintWindow(data: EchoPrintPayload) {
  const w = openEchoPrintWindowBlank();
  if (!w) throw new Error('پنجره چاپ باز نشد (Popup blocker)');
  writeEchoPrintHtmlToWindow(w, data);
}
