import importlib
import os
import tempfile
import unittest
from uuid import uuid4

from fastapi.testclient import TestClient


class RagSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        os.environ["CHROMA_PERSIST_DIR"] = cls.temp_dir.name
        os.environ["EMBEDDING_BACKEND"] = "hash"
        cls.module = importlib.import_module("main")
        cls.client = TestClient(cls.module.app)

    @classmethod
    def tearDownClass(cls):
        cls.module.vector_client.clear_system_cache()
        cls.temp_dir.cleanup()

    def test_search_is_tenant_scoped_and_returns_citation(self):
        organization_a = str(uuid4())
        organization_b = str(uuid4())
        document_a = str(uuid4())
        document_b = str(uuid4())
        version_a = str(uuid4())
        version_b = str(uuid4())

        for organization, document, version, text in [
            (organization_a, document_a, version_a, "قرارداد محرمانه سازمان الف"),
            (organization_b, document_b, version_b, "قرارداد محرمانه سازمان ب"),
        ]:
            response = self.client.post("/rag/index", json={
                "organizationId": organization,
                "documentId": document,
                "versionId": version,
                "chunks": [{"text": text, "page": 7, "section": "ماده ۱"}],
            })
            self.assertEqual(200, response.status_code, response.text)

        response = self.client.post("/rag/search", json={
            "organizationId": organization_a,
            "query": "قرارداد محرمانه",
            "limit": 10,
        })
        self.assertEqual(200, response.status_code, response.text)
        results = response.json()["results"]
        self.assertEqual(1, len(results))
        self.assertEqual(document_a, results[0]["citation"]["documentId"])
        self.assertEqual(version_a, results[0]["citation"]["versionId"])
        self.assertEqual(7, results[0]["citation"]["page"])

    def test_index_rejects_missing_tenant_context(self):
        response = self.client.post("/rag/index", json={
            "chunks": [{"text": "نباید ایندکس شود"}]
        })
        self.assertEqual(422, response.status_code)

    def test_persian_digits_are_normalized_for_numeric_reranking(self):
        organization = str(uuid4())
        document = str(uuid4())
        version = str(uuid4())
        response = self.client.post("/rag/index", json={
            "organizationId": organization,
            "documentId": document,
            "versionId": version,
            "chunks": [
                {"text": "مبلغ قرارداد ۱۵٬۰۰۰٬۰۰۰٬۰۰۰ ریال است", "page": 3},
                {"text": "مبلغ قرارداد 12000000000 ریال است", "page": 4},
            ],
        })
        self.assertEqual(200, response.status_code, response.text)

        response = self.client.post("/rag/search", json={
            "organizationId": organization,
            "query": "مبلغ 15000000000 ریال",
            "limit": 2,
        })
        self.assertEqual(200, response.status_code, response.text)
        results = response.json()["results"]
        self.assertEqual(3, results[0]["citation"]["page"])
        self.assertGreater(results[0]["score"], results[1]["score"])


if __name__ == "__main__":
    unittest.main()
