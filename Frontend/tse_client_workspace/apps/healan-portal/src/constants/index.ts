import { environment } from '../environments/environment';

/** ورود کاربر — پنل کلینیک (OAuth را AuthGuard شروع می‌کند) */
export function goToLogin() {
  window.location.href =
    environment.authLoginUrl ||
    environment.clinicAppUrl ||
    'http://clinic.drshahrooei.ir/';
}

/** @deprecated از goToLogin استفاده کنید */
export function goToClinicLogin() {
  goToLogin();
}

export function callForAppointment() {
  window.location.href = '/booking';
}

export function callClinicPhone() {
  window.location.href = `tel:${environment.phone}`;
}

export const DOCTOR = {
  name: 'دکتر معصومه شهرویی',
  shortName: 'معصومه شهرویی',
  specialty: 'متخصص قلب و عروق',
  board: 'فارغ‌التحصیل و دارای بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی تهران',
  general: 'فارغ‌التحصیل مقطع عمومی از دانشگاه علوم پزشکی تهران',
  address:
    'شوشتر، خیابان طالقانی، پایین‌تر از خیابان سادات، ساختمان پزشکان دکتر جلالی (آزمایشگاه سلامت)، طبقه دوم، واحد ۲',
  city: 'شوشتر',
};
