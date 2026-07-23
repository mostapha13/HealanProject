# تست داخلی اپ کلینیک (فاز ۱)

## بیلد APK

```bash
cd Frontend/healan-clinic-app
npm install
npx eas-cli build -p android --profile preview
```

یا اگر `eas` نصب است:

```bash
npm run eas:build:android
```

قبل از تست واقعی، `identity-server` با کلاینت `HealanClinicMobile` و redirect `healanclinic://redirect` باید بالا باشد.

## چک‌لیست نقش‌ها

| نقش | انتظار تب‌ها |
|-----|----------------|
| Admin | داشبورد، صف، نوبت، بیماران |
| Secretary | معمولاً همهٔ عملیاتی (بسته به AccessRole) |
| Doctor | داشبورد / صف / نوبت / بیماران طبق grant |
| ContentProducer | فقط اگر URL مربوطه در MyMenus باشد؛ وگرنه فقط داشبورد fallback |

## سناریوهای smoke

1. ورود OIDC موفق و ذخیرهٔ توکن (بعد از kill اپ، نشست باقی بماند تا expire)
2. Refresh token بعد از نزدیک شدن به expire
3. خروج و پاک شدن Secure Store
4. لیست صف امروز / نوبت / بیمار با pull-to-refresh
5. تب‌های بدون دسترسی در bottom bar مخفی شوند
