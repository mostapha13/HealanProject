# Healan Clinic (Android / Expo)

اپ موبایل پرسنل کلینیک — فاز ۱ MVP.

## مخاطب و اسکوپ

- پرسنل: منشی / پزشک / ادمین
- صفحات: داشبورد، صف انتظار، نوبت‌ها، بیماران
- منو از `UserAccess/MyMenus` (همان AccessMenu وب)
- Auth: OIDC PKCE با کلاینت `HealanClinicMobile`

## پیش‌نیاز سرور

کلاینت Identity باید ثبت شده باشد (`Config.cs` + appsettings):

- Redirect: `healanclinic://redirect`
- Scopes: `openid profile Content_Producer offline_access`

بعد از deploy، `identity-server` را recreate کنید.

## توسعه محلی

```bash
cd Frontend/healan-clinic-app
cp .env.example .env
npm install
npx expo start
```

روی دستگاه، redirect URI نمایش‌داده‌شده در صفحهٔ ورود را در صورت نیاز به Identity اضافه کنید (برای Expo Go معمولاً `exp://...`).

## بیلد APK داخلی (EAS)

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

پروفایل `preview` در `eas.json` خروجی APK داخلی می‌سازد.

## تست نقش‌ها

1. ورود با Admin → هر چهار تب
2. ورود با Doctor → داشبورد / صف / نوبت / بیماران بر اساس grant نقش
3. ورود با ContentProducer → فقط تب‌هایی که URL آن‌ها در MyMenus هست

## ساختار

- `app/` — Expo Router (login + tabs)
- `src/auth` — OIDC + Secure Store
- `src/api` — Healan + UserManager
- `src/access` — منوی داینامیک MVP
