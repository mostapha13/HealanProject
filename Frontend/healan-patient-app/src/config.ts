const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const config = {
  healanApiUrl: trimSlash(
    process.env.EXPO_PUBLIC_HEALAN_API_URL ?? 'https://clinic.drshahrooei.ir/Healan/api/v1'
  ),
  scheme: 'healanpatient',
  brandName: 'کلینیک قلب و عروق دکتر معصومه شهرویی',
  brandSubtitle:
    'فارغ التحصیل و دارای بورد تخصصی از بیمارستان فوق تخصصی شهید رجایی تهران',
};
