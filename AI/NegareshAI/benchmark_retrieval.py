"""Deterministic retrieval-quality gate for the private Persian RAG pipeline."""
import argparse
import importlib
import os
import tempfile
from uuid import uuid4

from fastapi.testclient import TestClient


CASES = [
    ("مبلغ قرارداد پانزده میلیارد ریال", "مبلغ قرارداد ۱۵٬۰۰۰٬۰۰۰٬۰۰۰ ریال است."),
    ("مهلت فسخ قرارداد", "هر یک از طرفین تا ده روز حق فسخ قرارداد را دارد."),
    ("مرجع حل اختلاف", "مرجع حل اختلاف، مرکز داوری اتاق بازرگانی تهران است."),
    ("تاریخ پایان قرارداد", "تاریخ پایان قرارداد ۱۴۰۵/۱۲/۲۹ تعیین می‌شود."),
    ("درصد تضمین حسن انجام کار", "تضمین حسن انجام کار معادل ده درصد مبلغ قرارداد است."),
]


def run(backend: str, model_id: str, minimum_recall: float) -> float:
    with tempfile.TemporaryDirectory() as directory:
        os.environ["CHROMA_PERSIST_DIR"] = directory
        os.environ["EMBEDDING_BACKEND"] = backend
        module = importlib.import_module("main")
        client = TestClient(module.app)
        organization = str(uuid4())
        user = "benchmark-user"
        expected = []
        for _, text in CASES:
            document = str(uuid4())
            expected.append(document)
            response = client.post("/rag/index", json={
                "organizationId": organization,
                "documentId": document,
                "versionId": str(uuid4()),
                "embeddingModel": model_id,
                "allowedUserIds": [user],
                "chunks": [{"text": text, "page": 1}],
            })
            response.raise_for_status()
        hits = 0
        for index, (query, _) in enumerate(CASES):
            response = client.post("/rag/search", json={
                "organizationId": organization,
                "userId": user,
                "query": query,
                "embeddingModel": model_id,
                "limit": 1,
            })
            response.raise_for_status()
            results = response.json()["results"]
            hits += int(bool(results)
                        and results[0]["citation"]["documentId"] == expected[index])
        recall = hits / len(CASES)
        print(f"Persian retrieval Recall@1: {recall:.2%} ({hits}/{len(CASES)})")
        if recall < minimum_recall:
            raise SystemExit(
                f"Recall@1 {recall:.2%} is below required {minimum_recall:.2%}")
        return recall


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", choices=["hash", "semantic"], default="semantic")
    parser.add_argument("--model", default="BAAI/bge-m3")
    parser.add_argument("--minimum-recall", type=float, default=0.8)
    arguments = parser.parse_args()
    run(arguments.backend, arguments.model, arguments.minimum_recall)
