# Sprint 6 — درک معنایی عمومی و مرزبندی SQL/RAG

## هدف

کاهش وابستگی به عبارت‌های ثابت و نزدیک‌کردن رفتار چت‌بات به درک مفهومی سؤال‌های رسمی، محاوره‌ای، جابه‌جا، ناقص و دارای غلط نگارشی؛ بدون واگذاری اختیار SQL یا ابزارها به مدل زبانی.

## خروجی‌ها

- قرارداد `SemanticQuestionFrame` شامل Domain، Operation، Entity، Metric، Temporal، ResponseShape، Confidence و Clarification؛
- سرویس محلی `/chat/semantic-compile` با JSON بسته و دو تلاش محدود برای اصلاح خروجی نامعتبر؛
- اعتبارسنجی مستقل در Python و .NET برای جلوگیری از جعل نام/نماد یا تغییر موضوع سؤال؛
- حفظ Fast Path قطعی برای سؤال‌های شناخته‌شده و اجرای Compiler فقط در حالت `no-match`؛
- بازنویسی سؤال حل‌نشده به سؤال مستقل و صریح برای Typed Tools؛
- Materializer قطعی برای تبدیل Frame معنایی به دستور استاندارد ابزار SQL، بدون تولید SQL یا واقعیت توسط مدل؛
- `semantic.guard` برای جلوگیری از سقوط سؤال ساختاریافته به RAG اخبار؛
- Fail-closed شدن Planner نامطمئن و رد کامل `knowledge-safe-default` به‌جای جست‌وجوی برداری نامرتبط؛
- ارسال Domain، Operation و ResponseShape به Reflection نهایی؛
- پذیرش قطعی پاسخ فقط در صورت سازگاری با شکل درخواستی، به‌ویژه `names_only` و `short`؛
- تست قرارداد API، جعل Entity، Metric خارج Allow-list، ابهام واقعی، Repair و fallback محلی؛
- اضافه‌شدن نمونه‌های واقعی به Golden Suite و Semantic Equivalence Corpus.

## سیاست اجرا

1. Temporal و Conversation Context ابتدا حل می‌شوند.
2. Canonical SQL Parsers روی سؤال مؤثر اجرا می‌شوند.
3. فقط در صورت `no-match` و نبود مسیر قطعی بازار، Semantic Compiler اجرا می‌شود.
4. Canonical Question دوباره در مرز Typed SQL ارزیابی می‌شود.
5. Structured miss با پاسخ fail-closed یا clarification پایان می‌یابد.
6. Knowledge/Explain می‌تواند وارد Hybrid Retrieval شود.
7. پاسخ نهایی با Evidence، Reflection و Answer Validation کنترل می‌شود.

## معیار پذیرش

- هیچ Entity تولیدشده‌ای خارج از متن سؤال پذیرفته نشود؛
- هیچ Domain/Operation/Metric خارج Allow-list پذیرفته نشود؛
- سؤال شمارشی یا هویتی ساختاریافته به خبر نامرتبط پاسخ داده نشود؛
- شکل‌های متفاوت یک مفهوم، Route و منبع یکسان بگیرند؛
- همه تست‌های Python، .NET Smoke، Conversation Golden و تست UI پاس شوند؛
- API پس از rebuild سالم، بدون Restart و OOM باقی بماند.

## نتیجه نهایی اجرا روی محیط محلی

- Python: تعداد 129 تست پاس؛
- .NET: هر 14 پروژه Smoke پاس؛
- Conversation Golden: تعداد 35 از 35 پاس، p95 برابر 473.15ms؛
- Semantic Equivalence: تعداد 39 از 39 پاس، p50 برابر 165.88ms و p95 برابر 4563.47ms؛
- UI: نمایش «در حال جستجو»، ارسال با Enter، خط جدید با Shift+Enter و پاسخ نهایی کلمه‌به‌کلمه تأیید شد؛
- کانتینرهای Gateway، API، AI و Local LLM سالم، بدون Restart و بدون OOM هستند.

داده بازار محلی در زمان این اجرا مربوط به 1405/05/20 بود. سناریوهای بازار، رد امن داده منقضی توسط Quality Gate را نیز پاسخ صحیح محسوب می‌کنند؛ این سیاست از نمایش عدد قدیمی به‌عنوان داده جاری جلوگیری می‌کند.
