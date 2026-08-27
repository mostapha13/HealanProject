import asyncio
import json

from app import llm_chat_reflection, llm_conversation_rewriter, llm_grounded_answer


def _enable(monkeypatch):
    monkeypatch.setenv("LLM_CHAT_PLANNER_ENABLED", "true")
    monkeypatch.setenv("LLM_BASE_URL", "http://local-llm:8080/v1")
    monkeypatch.setenv("LLM_MODEL", "qwen-local")


def _response(value):
    return {"choices": [{"message": {"content": json.dumps(value, ensure_ascii=False)}}]}


def test_followup_rewriter_resolves_active_organization_person(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({
            "standalone_question": "بهروز خالق‌ویردی نماینده کدام شرکت در هیئت‌مدیره بورس تهران است؟",
            "context_applied": True,
            "reason": "active-person",
        })

    monkeypatch.setattr(llm_conversation_rewriter, "post_chat_completion", fake)
    result = asyncio.run(llm_conversation_rewriter.rewrite_conversation_with_llm(
        "نماینده کدوم شرکت هست؟",
        {"subjectName": "بهروز خالق‌ویردی", "subjectRole": "رئیس هیئت‌مدیره"},
        [{"question": "رئیس هیئت مدیره کیه؟", "answer": "بهروز خالق‌ویردی است."}],
    ))
    assert result and result["context_applied"]
    assert "بهروز خالق‌ویردی" in result["standalone_question"]


def test_grounded_synthesizer_returns_question_focused_answer(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({"answer": "عسگر نوربخش — در خبر ۱۴۰۳، نماینده سرمایه‌گذاری تدبیر معرفی شده است؛ مدرک جاری‌تری یافت نشد."})

    monkeypatch.setattr(llm_grounded_answer, "post_chat_completion", fake)
    answer = asyncio.run(llm_grounded_answer.synthesize_grounded_answer({
        "question": "نماینده کدام شرکت است؟",
        "structuredAnswer": "عسگر نوربخش، نائب‌رئیس هیئت‌مدیره است.",
        "structuredFacts": [],
        "evidence": [{"sourceId": "93747", "publishedAt": "2024-12-21", "text": "عسگر نوربخش به نمایندگی از سرمایه‌گذاری تدبیر"}],
        "missingFacets": ["representing_company"],
        "recentTurns": [],
    }))
    assert answer and "سرمایه‌گذاری تدبیر" in answer


def test_grounded_evidence_focus_keeps_exact_field_lines_and_identity():
    text = """به گزارش بورس تهران، اوراق ایراندار با نماد صدار704 منتشر شد.
ضامن: رتبه اعتباری با کاهش توثیق سهام (بلندمدت BBB- و کوتاه‌مدت A3)
بازارگردان: صندوق نمونه
مجوز و گزارش‌های عمومی از پیوند زیر قابل دریافت است."""
    focused = llm_grounded_answer._focused_evidence_text(
        "تضمین اوراق ایراندار بر چه مبنایی است و رتبه‌هایش چیست؟", text)
    assert "ضامن:" in focused and "BBB-" in focused and "A3" in focused


def test_exact_evidence_answer_extracts_requested_labels_without_llm_guessing():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "تضمین اوراق ایراندار بر چه مبنایی است و رتبه‌هایش چیست؟",
        [{"text": "ضامن: رتبه اعتباری با کاهش توثیق سهام (بلندمدت BBB- و کوتاه‌مدت A3)\nحسابرس: موسسه نمونه"}],
    )
    assert answer == "مبنای تضمین/ضامن: رتبه اعتباری با کاهش توثیق سهام (بلندمدت BBB- و کوتاه‌مدت A3)."


def test_exact_evidence_answer_extracts_person_and_role():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "چه کسی از طراحی بازار خصوصی بورس تهران خبر داده؟",
        [{"text": "محمود گودرزی، مدیرعامل بورس تهران، در این نشست از طراحی بازار خصوصی خبر داد."}],
    )
    assert answer == "محمود گودرزی، مدیرعامل بورس تهران است."


def test_answer_spacing_separates_numeric_units_only():
    assert llm_grounded_answer._normalize_answer_spacing("۲۶شرکت و صدار704 و 3,۰۰۰") == "26 شرکت و صدار704 و 3,000"


def test_exact_evidence_answer_keeps_compound_count_and_rank_together():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "در صنعت خودرو چند ناشر پذیرفته‌شده وجود داشت و رتبه سایپا چند بود؟",
        [{"text": "در حال حاضر تعداد 26شرکت در این صنعت وجود دارد و سایپا رتبه دوم را در اختیار دارد."}],
    )
    assert "26 شرکت" in answer and "رتبه دوم" in answer


def test_exact_evidence_answer_normalizes_mixed_digits_for_value_and_rate():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "ارزش و نرخ سود اوراق را خلاصه بگو",
        [{"text": "اوراق به مبلغ 3,۰۰۰ میلیارد ریال، با نرخ سود ۲۳ درصد سالانه منتشر شد."}],
    )
    assert "3,000" in answer and "23 درصد" in answer


def test_exact_evidence_answer_keeps_duration_and_payment_interval():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "دوره عمر و فاصله پرداخت سود اوراق چقدر است؟",
        [{"text": "دوره عمر این اوراق 2 سال و مواعد پرداخت آن هر 3 ماه یک بار است."}],
    )
    assert "2 سال" in answer and "3 ماه" in answer


def test_exact_evidence_answer_keeps_fund_symbol_and_unit_count():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "صندوق بخشی صنایع تمدن با چه نمادی و چند واحد عرضه شد؟",
        [{"text": "صندوق بخشی صنایع تمدن با نماد \"دلتا\" درج شد. تعداد واحدهای سرمایه‌گذاری عادی جهت پذیره‌نویسی 970,000,000 واحد در نظر گرفته شده است."}],
    )
    assert answer and "دلتا" in answer and "970,000,000 واحد" in answer


def test_exact_evidence_answer_extracts_private_market_audience_and_goal():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "بازار خصوصی بورس تهران برای چه شرکت‌هایی و با چه هدفی طراحی می‌شود؟",
        [{"text": "بازاری که در آن شرکت‌های سهامی خاص، بدون تبدیل فوری به سهامی عام، بتوانند با اصول حاکمیت شرکتی، اصلاح ساختار مالکیت و تامین مالی از طریق بازار سرمایه آشنا شوند و به تدریج برای پذیرش در بازارهای اصلی آماده شوند."}],
    )
    assert answer and "شرکت‌های سهامی خاص" in answer and "حاکمیت شرکتی" in answer and "بازارهای اصلی" in answer


def test_exact_evidence_answer_extracts_identity_without_role_comma():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "چه کسی تغییرات جدید سفارش‌گذاری بورس تهران را توضیح داده؟",
        [{"text": "به گزارش بورس تهران، سید ناصر جعفری مدیر عملیات بازار سهام با بیان مطلب فوق گفت: ریزساختار سفارش‌گذاری تغییر کرد."}],
    )
    assert answer == "سید ناصر جعفری، مدیر عملیات بازار سهام است."


def test_exact_evidence_answer_extracts_electronic_acceptance_processes():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "قرار است کدام فرایندهای پذیرش ناشران الکترونیکی شود؟",
        [{"text": "به‌زودی بخش عمده فرآیندهای پذیرش و تعامل با ناشران به صورت کاملا الکترونیکی انجام خواهد شد و حتی امضای امیدنامه‌ها نیز به شکل دیجیتال خواهد بود."}],
    )
    assert answer and "فرآیندهای پذیرش" in answer and "تعامل با ناشران" in answer and "امضای امیدنامه" in answer


def test_exact_process_answer_can_select_the_complete_later_evidence_item():
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "قرار است کدام فرایندهای پذیرش ناشران الکترونیکی شود؟",
        [
            {"text": "فرایند لغو پذیرش ناشران در سایت قابل مشاهده است."},
            {"text": "شرکت‌ها در اولویت قرار می‌گیرند.وی گفت بخش عمده فرآیندهای پذیرش و تعامل با ناشران الکترونیکی انجام می‌شود و حتی امضای امیدنامه‌ها نیز دیجیتال خواهد بود."},
        ],
    )
    assert answer and "تعامل با ناشران" in answer and "دیجیتال" in answer


def test_exact_fund_manager_and_site_answers_use_source_fields():
    text = "مدیر: شرکت سبدگردان آبنوس\nبرای اطلاعات تکمیلی به نشانی https://green.abnouspmc.ir/ مراجعه نمایید."
    manager = llm_grounded_answer._extract_exact_evidence_answer(
        "مدیریت صندوق سبز آبنوس بر عهده کدام شرکت است؟", [{"text": text}])
    site = llm_grounded_answer._extract_exact_evidence_answer(
        "برای اطلاعات بیشتر صندوق سبز آبنوس باید به چه سایتی مراجعه کنم؟", [{"text": text}])
    assert manager == "مدیر: شرکت سبدگردان آبنوس."
    assert site and "green.abnouspmc.ir" in site


def test_exact_microstructure_answer_keeps_all_requested_effects():
    text = ("این تصمیم به کاهش اثر بازاری سفارش‌های با ارزش بالا کمک می‌کند."
            "این تغییرات موجب افزایش انعطاف‌پذیری در ثبت سفارش‌ها و ارتقای کیفیت اجرای معاملات می‌شود.")
    answer = llm_grounded_answer._extract_exact_evidence_answer(
        "اصلاح طبقات حجمی سفارش چه آثار مثبتی دارد؟", [{"text": text}])
    assert answer and "کاهش اثر بازاری" in answer and "افزایش انعطاف‌پذیری" in answer and "کیفیت اجرای معاملات" in answer


def test_exact_content_answer_is_concise_for_priority_and_saipa_facts():
    priority = llm_grounded_answer._extract_exact_evidence_answer(
        "گودرزی چه شرکت‌هایی را در اولویت پذیرش بورس اعلام کرده؟",
        [{"text": "شرکت‌های خصوصی استقبال کردند.سیاست ما این است هر شرکتی با سود خالص بیش از ۱۰۰ میلیارد تومان در اولویت پذیرش قرار گیرد.وی افزود سامانه جدید راه‌اندازی می‌شود."}],
    )
    ceremony = ("به گزارش بورس تهران، علی شیخ زاده، مدیرعامل گروه خودروسازی سایپا در ابتدای مراسم گفت: خوشحالیم."
                "گفتنی است سایپا امروز بیش از93 همت از ارزش بازار بورس تهران را به خود اختصاص داده است.")
    chief = llm_grounded_answer._extract_exact_evidence_answer(
        "مدیرعامل گروه خودروسازی سایپا در مراسم بورس چه کسی بود؟", [{"text": ceremony}])
    value = llm_grounded_answer._extract_exact_evidence_answer(
        "ارزش بازار سایپا در گزارش مراسم چند همت اعلام شده بود؟", [{"text": ceremony}])
    assert priority and "100 میلیارد تومان" in priority and len(priority) < 250
    assert chief and "علی شیخ زاده" in chief
    assert value and "93 همت" in value and len(value) < 250


def test_reflector_can_request_more_evidence_for_missing_compound_facet(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({
            "action": "retrieve_more",
            "improved_query": "سوابق عسگر نوربخش نمایندگی شرکت",
            "clarification": None,
            "reasons": ["missing-history"],
        })

    monkeypatch.setattr(llm_chat_reflection, "post_chat_completion", fake)
    result = asyncio.run(llm_chat_reflection.reflect_chat_with_llm({
        "question": "سابقه و شرکت نمایندگی او چیست؟",
        "answer": "عسگر نوربخش نائب‌رئیس است.",
        "intent": "knowledge",
        "confidence": .9,
        "evidence": ["عسگر نوربخش نائب‌رئیس است"],
    }))
    assert result and result.action == "retrieve_more"
    assert result.improved_query
