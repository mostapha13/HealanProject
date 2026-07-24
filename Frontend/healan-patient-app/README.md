# Healan Patient App

اپ موبایل بیمار با تم بنفش — ورود OTP پورتال.

## قابلیت‌ها

- خانه با اسلایدر سایت + میانبرها
- سوابق ویزیت/رزرو
- ثبت و جدول فشار خون
- یادآور داروها
- چت‌بات RAG
- رزرو نوبت
- پروفایل

## اجرا

```bash
cd Frontend/healan-patient-app
npm install
npm run web
```

پورت پیش‌فرض وب: `8083`

## بیلد APK اندروید (EAS) و قرار دادن روی سایت

تا وقتی فایل APK آماده نباشد، منوی سایت برای **اندروید و iOS** هر دو به `/mobile/` (PWA) لینک می‌دهد.

```bash
cd Frontend/healan-patient-app
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

بعد از اتمام بیلد، APK را از داشبورد Expo دانلود کنید، بعد روی سرور:

```bash
# از ماشین لوکال (مسیر فایل را عوض کنید)
scp ./healan-patient.apk root@YOUR_SERVER:/tmp/healan-patient.apk

# روی سرور
cd /opt/healan
mkdir -p Frontend/healan-www/public/downloads
cp /tmp/healan-patient.apk Frontend/healan-www/public/downloads/healan-patient.apk
export COMPOSE_PARALLEL_LIMIT=1
docker compose build --no-cache healan-www
docker compose up -d --force-recreate healan-www
docker compose up -d --force-recreate nginx-gateway
curl -I https://www.drshahrooei.ir/downloads/healan-patient.apk
```

برای فعال‌کردن لینک مستقیم APK در منو (به‌جای PWA)، در بیلد `healan-www` ست کنید:

`NEXT_PUBLIC_ANDROID_APK_URL=/downloads/healan-patient.apk`
