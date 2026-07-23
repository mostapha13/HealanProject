const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC = '٠١٢٣٤٥٦٧٨٩';

/** Convert Persian/Arabic digits to ASCII, keep other chars. */
export function toAsciiDigits(value: string): string {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)));
}

/** Normalize Iranian mobile to 09xxxxxxxxx */
export function normalizePhone(value: string): string {
  let p = toAsciiDigits(value).replace(/\D/g, '');
  if (p.startsWith('0098')) p = p.slice(4);
  if (p.startsWith('98') && p.length >= 12) p = p.slice(2);
  if (p.startsWith('9') && p.length === 10) p = `0${p}`;
  return p;
}

export function isValidMobile(phone: string): boolean {
  const p = normalizePhone(phone);
  return p.length === 11 && p.startsWith('09');
}
