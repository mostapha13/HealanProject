# گزارش پذیرش مرحلهٔ فعلی NegareshAI

تاریخ اجرا: 2026-07-28
محدوده: foundation تا IdentityProvider/FileManager و prototypeهای فعلی AI

## نتیجهٔ نهایی

**پذیرش مشروط زیرساخت: PASS**

زیرساخت Docker، احراز هویت، آپلود PDF/DOCX، ثبت SQL، استخراج پایه و
ماندگاری Chroma کار می‌کنند.

**پذیرش P0 امنیت چندسازمانی: PASS**

`OrganizationId` دیگر از کلاینت پذیرفته نمی‌شود، tenant در سرور تعیین می‌شود،
read/delete فیلتر tenant دارند و Production بدون claim سازمان fail-closed
است. برای استقرار Production، IdentityProvider باید claim سازمان معتبر صادر
کند.

**پذیرش مدیریت هوشمند قرارداد و تطابق اسناد: NOT IMPLEMENTED**

endpointهای فعلی AI فقط prototype هستند و معیارهای محصول در
`NEGARESHAI-PRODUCT-SPEC.md` را کامل نمی‌کنند.

## ماتریس تست

| حوزه | آزمون | نتیجه | توضیح |
|---|---|---:|---|
| Build | تست‌های NegareshAI API | PASS | 8/8 |
| Architecture | ثبت Handlerهای MediatR | PASS | upload/register/get ثبت و resolve شدند |
| Architecture | AutoMapper configuration | PASS | `AssertConfigurationIsValid` |
| Architecture | Controller بدون DbContext | PASS | جریان سند از ISender عبور می‌کند |
| Build | Next.js production build | PASS/GAP | build موفق؛ node_modules محلی 15.1.6 ولی image اجراشده 15.5.21 |
| Compose | اعتبارسنجی Compose NegareshAI | PASS | config معتبر |
| Compose | اعتبارسنجی root + local-prepublished | PASS | config معتبر |
| Runtime | Web | PASS | HTTP 200 |
| Runtime | API health | PASS | HTTP 200 |
| Runtime | API Swagger | PASS | HTTP 200 |
| Runtime | AI health | PASS | HTTP 200 |
| Runtime | Identity discovery | PASS | HTTP 200 |
| Runtime | FileManager Swagger | PASS | HTTP 200 |
| Auth | endpoint محافظت‌شده بدون token | PASS | HTTP 401 |
| Auth | password grant محلی | PASS | access token دریافت شد |
| CORS | preflight از Web | PASS | HTTP 204 و origin صحیح |
| Upload | PDF از NegareshAI به FileManager | PASS | HTTP 201 |
| Upload | DOCX از NegareshAI به FileManager | PASS after fix | stream disposal اصلاح شد |
| Persistence | Document و Version در SQL | PASS | برای هر upload یک رکورد ثبت شد |
| Read API | بازخوانی FileId نسخه | PASS after fix | EF Include اضافه شد |
| SQL | migration | PASS | 7 جدول پایه |
| AI | استخراج PDF متنی | PASS (prototype) | 2227 کاراکتر |
| AI | استخراج DOCX | PASS (prototype) | 440 کاراکتر |
| AI | OCR فایل اسکن‌شده | GAP | پیاده نشده |
| AI | chunk پایه | PASS (prototype) | chunk تولید شد |
| RAG | index/search پایه | PASS (prototype) | شناسهٔ chunk بازیابی شد |
| RAG | persistence بعد از restart | PASS | داده پس از restart باقی ماند |
| RAG | embedding معنایی فارسی | FAIL/GAP | embedding فعلی hash-based است |
| RAG | tenant/ACL isolation | FAIL/GAP | metadata و فیلتر مجوز ندارد |
| Contract | تولید DOCX از placeholder | PASS (prototype) | DOCX معتبر برگردانده شد |
| Contract | دستور فارسی و RAG | NOT IMPLEMENTED | ChangeSet/LLM/RAG وجود ندارد |
| Contract | مقایسهٔ DOCX | PASS (prototype) | added/removed تشخیص داده شد |
| Contract | تحلیل تغییر حقوقی/عددی/تاریخی | NOT IMPLEMENTED | diff معنایی وجود ندارد |
| Compliance | بررسی عین عبارت | PASS (prototype) | matched/missing و evidence پایه |
| Matching | گروه/RuleSet/سند مرجع/ترکیبی | NOT IMPLEMENTED | مدل و workflow وجود ندارد |
| Security | OrganizationId معتبر از identity/server context | PASS | مقدار کلاینت حذف و مقدار مخرب نادیده گرفته شد |
| Security | جلوگیری از دسترسی cross-tenant | PASS | read و delete سند tenant دیگر رد شدند |
| Security | Production fail-closed | PASS | نبود claim سازمان باعث رد context می‌شود |
| Security | audit log محصول | PASS (P0 scope) | create/view/delete ثبت می‌شوند |
| Domain | محرمانگی و processing status | PASS | در مدل و SQL ثبت شد |
| Domain | soft delete | PASS | DELETE=204 و GET بعدی=404 |
| Domain | مدل پایه قرارداد | PASS (P0 scope) | party/clause/value/date/obligation/attachment |

## نقص‌های پیدا و اصلاح‌شده در همین دور

### معماری Application/CQRS

جریان upload/register/get از Controller و DbContext مستقیم به MediatR
Command/Query Handler منتقل شد. نگاشت RegisterDocument و DocumentResponse با
AutoMapper Profile انجام می‌شود. تست معماری، ثبت Handlerها و اعتبار Profileها
اضافه شد و تست Docker PDF/DOCX پس از refactor موفق بود.

### آپلود DOCX

`MimeDetective` هنگام بررسی DOCX، stream ورودی را می‌بست و FileManager هنگام
ذخیره با `ObjectDisposedException` شکست می‌خورد. stream تشخیص MIME و stream
ذخیره از یک buffer مستقل ساخته شدند. تست مجدد DOCX موفق شد.

### FileId در GET سند

endpoint خواندن سند navigation مربوط به `DocumentVersions` را بارگذاری
نمی‌کرد و `FileId` خالی برمی‌گرداند. query با `AsNoTracking` و `Include` اصلاح
شد. تست نهایی تطابق FileId ایجادشده و بازخوانی‌شده موفق شد.

### SQL قابل‌بازتولید

volume قبلی با credential نامعلوم/قدیمی ساخته شده بود و پس از recreate با
Compose جدید healthcheck نمی‌شد. volume قبلی حذف نشد و برای حفظ امکان بازیابی
دست‌نخورده باقی ماند. محیط تست به volume نسخه‌دار `negareshai-sql-v3` منتقل
شد و migration و تست‌های PDF/DOCX از ابتدا موفق شدند.

## ریسک‌ها و blockerهای پذیرش محصول

1. صدور claim سازمان معتبر توسط IdentityProvider در استقرار Production.
2. embedding واقعی فارسی/چندزبانهٔ محلی.
3. ACL metadata در vector store.
4. OCR و citation صفحه/بند.
5. API/UI مدیریت کامل قرارداد و نسخه‌ها در P1.
6. موتور تطابق گروه/قاعده/سند مرجع.
7. تولید قرارداد با دستور طبیعی، RAG، preview و human approval.
8. dependencyهای دارای هشدار امنیتی در Share/FileManager و dependencyهای
   frontend باید جداگانه اصلاح یا risk-accept شوند.

## تصمیم ادامه

مرحلهٔ زیرساخت و P0 پذیرفته‌اند. ادامه باید مستقیماً از P1 در
`NEGARESHAI-ROADMAP.md` آغاز شود. در Production، ورود سند منوط به صدور claim
سازمان توسط IdentityProvider و تنظیمات بدون fallback توسعه است.
## P1 document-management slice

Validated after commit `5725fee` on branch `codex/negareshai-foundation`:

| Area | Scenario | Result |
|---|---|---|
| Backend tests | MediatR/AutoMapper and tenant-scoped document operations | PASS (9/9) |
| Frontend | Next.js production build | PASS |
| Docker | NegareshAI DB, API, AI and Web health | PASS |
| Upload | Authenticated PDF upload through FileManager | PASS |
| Search | Tenant-scoped title search | PASS |
| Edit | Title, type and confidentiality update | PASS |
| Versioning | Authenticated DOCX upload as version 2 | PASS |
| Immutability | List reports two retained versions and a new latest FileId | PASS |

The first SQL run exposed an EF tracking defect: the newly constructed
`DocumentVersion` was treated as an existing row and emitted an UPDATE. The
handler was corrected to add the entity explicitly to `DocumentVersions`; the
full Docker scenario then passed. No credentials or bearer tokens are retained
in this document.

## P1 completion acceptance

| Area | Scenario | Result |
|---|---|---|
| Backend tests | CQRS/AutoMapper, tenant isolation, contracts and restore | PASS (12/12) |
| Frontend | Next.js production build and type validation | PASS |
| Contract | Create with document, dates, amount, currency and party | PASS |
| Contract | Update metadata/status and persist party replacement | PASS |
| Contract | Tenant-scoped search and archive | PASS |
| Document | Detail and immutable version history | PASS |
| Document | Authenticated download proxy to FileManager | PASS (149584 bytes) |
| Document | Archive, archived listing and restore | PASS |
| UI | Contract CRUD and complete document lifecycle connected | PASS (build) |

The final Web source changed after the last running Docker image was produced.
Rebuild/recreate needs the operator-provided `NEGARESHAI_SQL_PASSWORD` in a
local `.env`; credentials are intentionally neither inferred nor stored here.

## P2 secure-pipeline slice

| Area | Scenario | Result |
|---|---|---|
| AI build | Build isolated AI Docker image | PASS |
| Index security | Missing tenant/document/version metadata | PASS (HTTP 422) |
| Tenant isolation | Search organization A with A+B indexed | PASS (only A) |
| Citation | Result contains document, version, page and section | PASS |
| API integration | Upload/version invokes typed private processor | PASS (build/tests) |
| Processing state | Processing then Ready/Failed with audit | PASS (code/tests) |
| Backend regression | Existing architecture and tenant tests | PASS (12/12) |
| Semantic embedding | Local Persian/multilingual model | GAP |
| OCR | Scanned PDF pages | GAP |
