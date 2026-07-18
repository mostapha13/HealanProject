from app.config import Settings
from app.data.base import Document
from app.rag.summarize_docs import enrich_documents_with_summaries
from app.services.summarizer import fallback_summary, strip_html


def test_strip_html_and_fallback():
    assert "فشار خون" in strip_html("<p>فشار خون <b>بالا</b></p>")
    short = fallback_summary("الف " * 20, max_chars=30)
    assert len(short) <= 30


def test_enrich_blog_without_llm_uses_fallback(monkeypatch):
    settings = Settings(
        openai_api_key="",
        rag_summarize_enabled=True,
        rag_summarize_fallback_chars=80,
        rag_summarize_skip_if_shorter_than=10,
    )
    long_body = "فشار خون بالا می‌تواند باعث سردرد و تاری دید شود. " * 8
    docs = [
        Document(
            id="blog-1",
            content=f"فشار خون | {long_body}",
            metadata={
                "source": "blog",
                "title": "فشار خون",
                "raw_text": long_body,
                "answer": "old",
            },
        ),
        Document(
            id="faq-1",
            content="آدرس مطب",
            metadata={"source": "faq", "answer": "شوشتر"},
        ),
    ]
    out = enrich_documents_with_summaries(docs, settings)
    blog = next(d for d in out if d.id == "blog-1")
    faq = next(d for d in out if d.id == "faq-1")
    assert "raw_text" not in blog.metadata
    assert blog.metadata["answer"]
    assert blog.metadata["answer"] != "old"
    assert "فشار خون" in blog.content
    assert faq.metadata["answer"] == "شوشتر"
