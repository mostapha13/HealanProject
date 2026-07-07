/** اعتبارسنجی کد ملی ایران (۱۰ رقم + رقم کنترل) */
export function isValidIranNationalCode(code: string): boolean {
  const trimmed = code.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;
  if (/^(\d)\1{9}$/.test(trimmed)) return false;

  const check = Number(trimmed[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(trimmed[i]) * (10 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}
