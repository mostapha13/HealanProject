import type { BpDayRow, BpPeriodSlot } from './groupBloodPressureByDay';

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

export type BloodPressurePrintPayload = {
  patientName: string;
  patientNationalCode?: string | null;
  printedAtLabel: string;
  days: BpDayRow[];
};

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(slot: BpPeriodSlot | undefined, key: keyof BpPeriodSlot): string {
  if (!slot) return '—';
  const v = slot[key];
  if (v == null || v === '') return '—';
  return esc(v);
}

function dayRowsHtml(days: BpDayRow[]): string {
  if (!days.length) {
    return `<tr><td colspan="16" class="empty">هنوز ثبتی ندارید.</td></tr>`;
  }
  return days
    .map((d) => {
      const periods = [d.morning, d.noon, d.night] as const;
      const cells = periods
        .map(
          (p) => `
        <td>${cell(p, 'measuredTime')}</td>
        <td class="sys">${cell(p, 'systolic')}</td>
        <td class="dia">${cell(p, 'diastolic')}</td>
        <td>${cell(p, 'pulse')}</td>
        <td class="note">${cell(p, 'note')}</td>`
        )
        .join('');
      return `<tr><td class="date">${esc(d.jalaliLabel)}</td>${cells}</tr>`;
    })
    .join('');
}

/** برگه چاپ بیمار — زیباتر از نسخه کلینیک، هدر برند و فوتر کامل. */
export function buildBloodPressurePrintHtml(data: BloodPressurePrintPayload): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گزارش فشار خون — ${esc(data.patientName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      color: #0f172a;
      background: #e2e8f0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 8px;
    }
    .sheet {
      width: 297mm;
      min-height: 210mm;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
    }
    .hero {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 45%, #14b8a6 100%);
      color: #fff;
      padding: 7mm 8mm 5mm;
      position: relative;
    }
    .hero::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 4px;
      background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .hero h1 {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .hero .doctor {
      font-size: 15px;
      font-weight: 700;
      margin-top: 3px;
      opacity: 0.97;
    }
    .hero .spec {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .badge {
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      backdrop-filter: blur(4px);
    }
    .patient-card {
      margin: 4mm 8mm 0;
      padding: 3.5mm 4mm;
      border-radius: 10px;
      background: linear-gradient(180deg, #f0fdfa 0%, #ecfeff 100%);
      border: 1px solid #99f6e4;
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 8px 16px;
      font-size: 12px;
    }
    .patient-card .lbl {
      display: block;
      font-size: 10px;
      color: #0f766e;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .patient-card .val {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
    }
    .body {
      flex: 1;
      padding: 4mm 8mm 3mm;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f766e;
      margin-bottom: 2.5mm;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, #99f6e4, transparent);
    }
    table.bp {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 10.5px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    table.bp th, table.bp td {
      border-bottom: 1px solid #e2e8f0;
      border-left: 1px solid #e2e8f0;
      padding: 5px 4px;
      text-align: center;
      vertical-align: middle;
    }
    table.bp th:last-child, table.bp td:last-child { border-left: none; }
    table.bp tbody tr:last-child td { border-bottom: none; }
    table.bp thead th {
      font-weight: 700;
      color: #334155;
      background: #f8fafc;
    }
    table.bp thead .period { background: #ccfbf1; color: #0f766e; }
    table.bp thead .period-noon { background: #e0f2fe; color: #0369a1; }
    table.bp thead .period-night { background: #ede9fe; color: #5b21b6; }
    table.bp .date {
      font-weight: 800;
      white-space: nowrap;
      background: #f8fafc;
      color: #0f172a;
    }
    table.bp .sys { color: #dc2626; font-weight: 800; }
    table.bp .dia { color: #2563eb; font-weight: 800; }
    table.bp .note { font-size: 9.5px; color: #475569; text-align: right; max-width: 70px; }
    table.bp .empty { padding: 18px; color: #64748b; }
    .footer {
      margin-top: auto;
      background: #0f172a;
      color: #e2e8f0;
      padding: 4mm 8mm;
      font-size: 10.5px;
      line-height: 1.65;
      text-align: center;
    }
    .footer strong { color: #fff; font-size: 12px; }
    .footer .addr { opacity: 0.9; margin: 2px 0 4px; }
    .footer .contacts { opacity: 0.82; font-size: 10px; }
    .footer .contacts span { margin: 0 6px; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; width: 100%; min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="hero">
      <div class="hero-top">
        <div>
          <h1>${esc(CLINIC.name)}</h1>
          <div class="doctor">${esc(CLINIC.doctor)}</div>
          <div class="spec">${esc(CLINIC.specialty)}</div>
        </div>
        <div class="badge">گزارش فشار خون بیمار</div>
      </div>
    </header>

    <div class="patient-card">
      <div>
        <span class="lbl">نام بیمار</span>
        <span class="val">${esc(data.patientName)}</span>
      </div>
      <div>
        <span class="lbl">کد ملی</span>
        <span class="val">${esc(data.patientNationalCode) || '—'}</span>
      </div>
      <div>
        <span class="lbl">تاریخ چاپ</span>
        <span class="val">${esc(data.printedAtLabel)}</span>
      </div>
    </div>

    <div class="body">
      <div class="section-title">جدول ثبت‌های روزانه (صبح · ظهر · عصر)</div>
      <table class="bp">
        <thead>
          <tr>
            <th rowspan="2" style="width:9%">تاریخ</th>
            <th colspan="5" class="period">صبح</th>
            <th colspan="5" class="period-noon">ظهر</th>
            <th colspan="5" class="period-night">عصر</th>
          </tr>
          <tr>
            <th>ساعت</th><th>سیستول</th><th>دیاستول</th><th>نبض</th><th>یادداشت</th>
            <th>ساعت</th><th>سیستول</th><th>دیاستول</th><th>نبض</th><th>یادداشت</th>
            <th>ساعت</th><th>سیستول</th><th>دیاستول</th><th>نبض</th><th>یادداشت</th>
          </tr>
        </thead>
        <tbody>
          ${dayRowsHtml(data.days)}
        </tbody>
      </table>
    </div>

    <footer class="footer">
      <strong>${esc(CLINIC.name)}</strong>
      <div class="addr">${esc(CLINIC.address)}</div>
      <div class="contacts">
        <span>تلفن مطب: ${esc(CLINIC.phone)}</span>
        <span>اینستاگرام: ${esc(CLINIC.instagram)}</span>
        <span>${esc(CLINIC.website)}</span>
      </div>
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

export function openBloodPressurePrintWindow(data: BloodPressurePrintPayload) {
  const w = window.open('', '_blank', 'width=1200,height=850');
  if (!w) throw new Error('پنجره چاپ باز نشد. اجازه پاپ‌آپ را فعال کنید.');
  const html = buildBloodPressurePrintHtml(data);
  w.document.open();
  w.document.write(html);
  w.document.close();
}
