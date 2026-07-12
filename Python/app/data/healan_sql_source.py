"""خواندن دانش پایه Healan از SQL Server برای RAG."""

from __future__ import annotations

import re
from html import unescape

from app.data.base import DataSource, Document


def _strip_html(value: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", text).strip()


def _meta(**kwargs: str) -> dict[str, str]:
    return {k: str(v) for k, v in kwargs.items() if v is not None and str(v).strip()}


class HealanSqlDataSource(DataSource):
    """منبع داده یکپارچه: FAQ + تنظیمات سایت + بخش‌ها + بلاگ + نظرات تأییدشده."""

    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def load(self) -> list[Document]:
        if not self.connection_string.strip():
            raise ValueError(
                "SQL Server is not configured. Set SQL_SERVER_CONNECTION_STRING in .env"
            )

        try:
            import pandas as pd
            from sqlalchemy import create_engine, text
        except ImportError as exc:
            raise ImportError(
                "Install pyodbc and sqlalchemy: pip install pyodbc sqlalchemy"
            ) from exc

        engine = create_engine(self.connection_string)
        documents: list[Document] = []

        with engine.connect() as conn:
            documents.extend(self._load_faq(conn, pd, text))
            documents.extend(self._load_settings(conn, pd, text))
            documents.extend(self._load_content(conn, pd, text))
            documents.extend(self._load_blogs(conn, pd, text))
            documents.extend(self._load_reviews(conn, pd, text))

        return documents

    def _load_faq(self, conn, pd, text) -> list[Document]:
        query = text(
            """
            SELECT RagKnowledgeItemId, Question, QuestionSummary, Keywords, Topic,
                   Answer, SimilarQuestions, SearchText, Priority
            FROM RagKnowledgeItems
            WHERE IsActive = 1 AND IsDeleted = 0
            """
        )
        df = pd.read_sql(query, conn)
        docs: list[Document] = []
        for _, row in df.iterrows():
            pk = str(row["RagKnowledgeItemId"])
            content = str(row.get("SearchText") or row.get("Question") or "").strip()
            answer = str(row.get("Answer") or "").strip()
            if not content or not answer:
                continue
            docs.append(
                Document(
                    id=f"faq-{pk}",
                    content=content,
                    metadata=_meta(
                        answer=answer,
                        source="faq",
                        id=pk,
                        topic=str(row.get("Topic") or ""),
                        priority=str(row.get("Priority") or "0"),
                    ),
                )
            )
        return docs

    def _load_settings(self, conn, pd, text) -> list[Document]:
        query = text(
            """
            SELECT SettingKey, SettingValue, Description
            FROM PortalSiteSettings
            """
        )
        df = pd.read_sql(query, conn)
        docs: list[Document] = []
        for _, row in df.iterrows():
            key = str(row.get("SettingKey") or "").strip()
            value = str(row.get("SettingValue") or "").strip()
            desc = str(row.get("Description") or "").strip()
            if not key or not value:
                continue
            question = desc or key
            content = f"{question} | {key} | {value}"
            docs.append(
                Document(
                    id=f"setting-{key}",
                    content=content,
                    metadata=_meta(
                        answer=value,
                        source="setting",
                        id=key,
                        topic="تنظیمات سایت",
                    ),
                )
            )
        return docs

    def _load_content(self, conn, pd, text) -> list[Document]:
        query = text(
            """
            SELECT PortalContentItemId, SectionType, Title, Subtitle, Body
            FROM PortalContentItems
            WHERE IsPublished = 1 AND IsDeleted = 0
            """
        )
        df = pd.read_sql(query, conn)
        docs: list[Document] = []
        for _, row in df.iterrows():
            pk = str(row["PortalContentItemId"])
            title = str(row.get("Title") or "").strip()
            subtitle = str(row.get("Subtitle") or "").strip()
            body = str(row.get("Body") or "").strip()
            section = str(row.get("SectionType") or "").strip()
            parts = [p for p in [title, subtitle, body, section] if p]
            if not parts:
                continue
            answer = " — ".join([p for p in [title, subtitle, body] if p])
            content = " | ".join(parts)
            docs.append(
                Document(
                    id=f"content-{pk}",
                    content=content,
                    metadata=_meta(
                        answer=answer,
                        source="content",
                        id=pk,
                        topic=section,
                    ),
                )
            )
        return docs

    def _load_blogs(self, conn, pd, text) -> list[Document]:
        query = text(
            """
            SELECT BlogPostId, Title, Excerpt, Body
            FROM BlogPosts
            WHERE IsPublished = 1 AND IsDeleted = 0
            """
        )
        df = pd.read_sql(query, conn)
        docs: list[Document] = []
        for _, row in df.iterrows():
            pk = str(row["BlogPostId"])
            title = str(row.get("Title") or "").strip()
            excerpt = str(row.get("Excerpt") or "").strip()
            body = _strip_html(str(row.get("Body") or ""))
            if not title:
                continue
            content = " | ".join([p for p in [title, excerpt, body[:500]] if p])
            answer = excerpt or body[:600] or title
            docs.append(
                Document(
                    id=f"blog-{pk}",
                    content=content,
                    metadata=_meta(
                        answer=answer,
                        source="blog",
                        id=pk,
                        topic="بلاگ",
                    ),
                )
            )
        return docs

    def _load_reviews(self, conn, pd, text) -> list[Document]:
        query = text(
            """
            SELECT PatientReviewId, DisplayName, ReviewText, Rating
            FROM PatientReviews
            WHERE Status = 2 AND IsDeleted = 0
            """
        )
        df = pd.read_sql(query, conn)
        docs: list[Document] = []
        for _, row in df.iterrows():
            pk = str(row["PatientReviewId"])
            name = str(row.get("DisplayName") or "بیمار").strip()
            review = str(row.get("ReviewText") or "").strip()
            rating = str(row.get("Rating") or "").strip()
            if not review:
                continue
            content = f"نظر بیمار {name} | امتیاز {rating} | {review}"
            answer = f"نظر {name}: {review}"
            docs.append(
                Document(
                    id=f"review-{pk}",
                    content=content,
                    metadata=_meta(
                        answer=answer,
                        source="review",
                        id=pk,
                        topic="نظرات بیماران",
                    ),
                )
            )
        return docs

    @staticmethod
    def read_sync_settings(connection_string: str) -> dict:
        try:
            import pandas as pd
            from sqlalchemy import create_engine, text
        except ImportError:
            return {}

        engine = create_engine(connection_string)
        with engine.connect() as conn:
            df = pd.read_sql(text("SELECT TOP 1 * FROM RagSettings"), conn)
        if df.empty:
            return {}
        row = df.iloc[0]
        return {
            "sync_interval_minutes": int(row.get("SyncIntervalMinutes") or 10),
            "similarity_threshold_percent": int(row.get("SimilarityThresholdPercent") or 55),
            "is_enabled": bool(row.get("IsEnabled", True)),
        }

    @staticmethod
    def touch_last_synced(connection_string: str) -> None:
        try:
            from sqlalchemy import create_engine, text
        except ImportError:
            return

        engine = create_engine(connection_string)
        with engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE RagSettings SET LastSyncedAt = SYSUTCDATETIME() WHERE RagSettingId = 1"
                )
            )
