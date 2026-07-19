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
    return `<tr><td colspan="16" class="empty">ثبتی برای نمایش وجود ندارد.</td></tr>`;
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
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 4mm;
    }
    .header {
      text-align: center;
      border-bottom: 2.5px solid #0d9488;
      padding-bottom: 3mm;
      margin-bottom: 3mm;
    }
    .header h1 { font-size: 16px; font-weight: 800; color: #0f172a; }
    .header .doctor { font-size: 14px; font-weight: 700; color: #0d9488; margin-top: 2px; }
    .header .spec { font-size: 11px; color: #64748b; }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      font-size: 11px;
      margin-bottom: 3mm;
      padding: 2.5mm 3mm;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 8px;
    }
    .meta strong { color: #0f766e; }
    table.bp {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      table-layout: fixed;
    }
    table.bp th, table.bp td {
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
      text-align: center;
      vertical-align: middle;
    }
    table.bp thead th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    table.bp thead .period { background: #ccfbf1; color: #0f766e; }
    table.bp thead .period-noon { background: #e0f2fe; color: #0369a1; }
    table.bp thead .period-night { background: #ede9fe; color: #5b21b6; }
    table.bp .date { font-weight: 700; white-space: nowrap; background: #f8fafc; }
    table.bp .sys { color: #dc2626; font-weight: 700; }
    table.bp .dia { color: #2563eb; font-weight: 700; }
    table.bp .note { font-size: 9px; color: #475569; text-align: right; }
    table.bp .empty { padding: 12px; color: #64748b; }
    .footer {
      margin-top: 4mm;
      padding-top: 3mm;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #475569;
      text-align: center;
      line-height: 1.6;
    }
    .footer strong { color: #0f172a; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>${esc(CLINIC.name)}</h1>
    <div class="doctor">${esc(CLINIC.doctor)}</div>
    <div class="spec">${esc(CLINIC.specialty)}</div>
  </header>

  <div class="meta">
    <div><strong>بیمار:</strong> ${esc(data.patientName)}</div>
    <div><strong>کد ملی:</strong> ${esc(data.patientNationalCode) || '—'}</div>
    <div><strong>عنوان گزارش:</strong> سوابق فشار خون</div>
    <div><strong>تاریخ چاپ:</strong> ${esc(data.printedAtLabel)}</div>
  </div>

  <table class="bp">
    <thead>
      <tr>
        <th rowspan="2" style="width:9%">تاریخ</th>
        <th colspan="5" class="period">صبح</th>
        <th colspan="5" class="period-noon">ظهر</th>
        <th colspan="5" class="period-night">شب</th>
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

  <footer class="footer">
    <strong>${esc(CLINIC.name)}</strong><br/>
    ${esc(CLINIC.address)}<br/>
    تلفن: ${esc(CLINIC.phone)} &nbsp;|&nbsp; اینستاگرام: ${esc(CLINIC.instagram)} &nbsp;|&nbsp; ${esc(CLINIC.website)}
  </footer>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 350);
    });
  </script>
</body>
</html>`;
}

export function openBloodPressurePrintWindow(data: BloodPressurePrintPayload) {
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) throw new Error('پنجره چاپ باز نشد (Popup blocker)');
  const html = buildBloodPressurePrintHtml(data);
  w.document.open();
  w.document.write(html);
  w.document.close();
}
