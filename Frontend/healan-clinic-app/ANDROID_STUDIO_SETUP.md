# نصب Android Studio روی ویندوز (دستی — لازم برای Emulator)

نصب خودکار از اینجا به‌خاطر محدودیت دانلود CDN گوگل (403/مسدود) کامل نشد.
JDK 17 نصب شد. برای Emulator این کارها را **خودت در مرورگر** انجام بده:

## ۱) دانلود و نصب Android Studio
1. برو به: https://developer.android.com/studio
2. Download Android Studio برای Windows
3. نصب‌کننده را اجرا کن (Next → Standard → Finish)
4. اولین باز شدن: Setup Wizard را تا آخر برو تا SDK و Emulator نصب شود

## ۲) ساخت Virtual Device
1. Android Studio → More Actions → Virtual Device Manager
2. Create Device → Pixel 6 → Next
3. System Image: API 34 (Download اگر لازم بود) → Finish
4. ▶ Play برای روشن کردن Emulator

## ۳) اجرای اپ Healan روی Emulator
```powershell
cd C:\Users\Mahdavi\.cursor\worktrees\Doctor\9jye\Frontend\healan-clinic-app
npx expo start
```
در ترمینال حرف `a` را بزن.

## الان بدون Emulator
پیش‌نمایش وب (UI) روی مرورگر:
http://localhost:8081
(لاگین موبایل کامل روی وب محدود است؛ Emulator/گوشی برای تست واقعی لازم است)
