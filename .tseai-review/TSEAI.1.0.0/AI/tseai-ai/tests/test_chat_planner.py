from app.chat_planner import plan_chat

def test_filter_intent_is_allowlisted():
    p=plan_chat("فیلتر سهم هایی که حجم بیشتر از یک میلیون دارند")
    assert p.intent=="marketfilter"
    assert p.confidence>.8

def test_market_symbol_intent():
    p=plan_chat("قیمت نماد فولاد چنده؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="فولاد"

def test_hybrid_market_and_knowledge():
    p=plan_chat("چرا قیمت نماد خودرو امروز افت کرده؟")
    assert p.intent=="hybrid"
    assert p.symbol=="خودرو"

def test_unknown_defaults_to_knowledge_not_tool_execution():
    p=plan_chat("توضیحی درباره بازار بده")
    assert p.intent in ("knowledge","clarification")


def test_temporal_terms_are_not_mistaken_for_symbol():
    p=plan_chat("قیمت فولاد فردا چنده؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="فولاد"


def test_persian_month_is_not_mistaken_for_symbol():
    p=plan_chat("قیمت فولاد 20 مرداد 1405 چقدر بود؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="فولاد"


def test_multiword_company_entity_hint():
    p=plan_chat("قیمت بانک ملت چنده؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="بانک ملت"


def test_multiword_company_with_temporal_words():
    p=plan_chat("وضعیت امروز ایران خودرو چطوره؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="ایران خودرو"


def test_knowledge_term_is_not_forced_into_entity_hint():
    p=plan_chat("اختیار معامله چیست؟")
    assert p.intent=="knowledge"
    assert p.symbol is None


def test_index_phrase_is_preserved_as_entity_hint():
    p=plan_chat("وضعیت شاخص کل امروز چطوره؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="شاخص کل"


def test_numeric_inscode_is_preserved_as_entity_hint():
    p=plan_chat("قیمت ۴۶۳۴۸۵۵۹۱۹۳۲۲۴۰۹۰ چنده؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="۴۶۳۴۸۵۵۹۱۹۳۲۲۴۰۹۰"


def test_long_company_name_is_preserved():
    p=plan_chat("قیمت شرکت ملی صنایع مس ایران چنده؟")
    assert p.intent=="marketsymbol"
    assert p.symbol=="شرکت ملی صنایع مس ایران"


def test_latest_news_does_not_trigger_market_tool():
    p=plan_chat("آخرین خبر بانک ملت چیست؟")
    assert p.intent=="knowledge"
    assert p.symbol is None


def test_trading_law_does_not_trigger_market_tool():
    p=plan_chat("قانون خرید و فروش سهام چیست؟")
    assert p.intent=="knowledge"
    assert p.symbol is None


def test_company_state_question_does_not_trigger_live_market_tool():
    p=plan_chat("پارس سرام چه وضعیتی دارد؟")
    assert p.intent=="knowledge"
    assert p.symbol is None


def test_explicit_current_market_status_still_uses_market_tool():
    p=plan_chat("وضعیت امروز ایران خودرو چطوره؟")
    assert p.intent=="marketsymbol"
