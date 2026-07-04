from app.rag.rerank import detect_districts, detect_specialty, filter_and_rerank


def test_detect_specialty_heart():
    assert detect_specialty("دکتر قلب در سعادت اباد") == "قلب و عروق"


def test_detect_district_saadat():
    assert "سعادت‌آباد" in detect_districts("دکتر قلب در سعادت اباد")


def test_filter_only_cardiologists():
    hits = [
        {
            "content": "نوع_رکورد: پزشک | عنوان: دکتر علی | دسته: اطفال | متن: سعادت‌آباد",
            "score": 0.9,
            "metadata": {"row": "1"},
        },
        {
            "content": "نوع_رکورد: پزشک | عنوان: دکتر سارا | دسته: قلب و عروق | متن: ونک",
            "score": 0.7,
            "metadata": {"row": "2"},
        },
    ]
    filtered, meta = filter_and_rerank("دکتر قلب", hits, top_k=5)
    assert len(filtered) == 1
    assert "سارا" in filtered[0]["content"]
    assert meta["specialty"] == "قلب و عروق"


def test_filter_heart_and_district_strict():
    hits = [
        {
            "content": "نوع_رکورد: پزشک | دسته: قلب و عروق | متن: ونک",
            "score": 0.8,
            "metadata": {},
        },
        {
            "content": "نوع_رکورد: پزشک | دسته: اطفال | متن: سعادت‌آباد",
            "score": 0.9,
            "metadata": {},
        },
    ]
    filtered, _ = filter_and_rerank("دکتر قلب در سعادت اباد", hits, top_k=5)
    # هیچ پزشک قلب در سعادت‌آباد نیست → relaxed فقط قلب
    assert all("قلب" in h["content"] for h in filtered)
    assert not any("اطفال" in h["content"] for h in filtered)
