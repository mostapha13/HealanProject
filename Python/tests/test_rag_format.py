from app.rag.pipeline import format_context


def test_format_context_includes_rows():
    hits = [
        {
            "content": "نام_پزشک: دکتر سارا",
            "metadata": {"row": "2", "source": "excel"},
            "score": 0.91,
        }
    ]
    text = format_context(hits)
    assert "دکتر سارا" in text
    assert "row/id=2" in text
