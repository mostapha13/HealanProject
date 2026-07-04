import { environment } from '../environments/environment';

/** ورود به سامانه Healan — AuthGuard کلینیک کاربر را به Identity هدایت می‌کند */
export function goToClinicLogin() {
  window.location.href = environment.clinicAppUrl;
}

export function callForAppointment() {
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
