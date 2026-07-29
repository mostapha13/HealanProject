import importlib
import os
import tempfile
import unittest
import base64
from io import BytesIO
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from pypdf import PdfWriter


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
        user_a = "user-a"
        user_b = "user-b"
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
                "allowedUserIds": [user_a if organization == organization_a else user_b],
                "chunks": [{"text": text, "page": 7, "section": "ماده ۱"}],
            })
            self.assertEqual(200, response.status_code, response.text)

        response = self.client.post("/rag/search", json={
            "organizationId": organization_a,
            "userId": user_a,
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
        user = "numeric-user"
        document = str(uuid4())
        version = str(uuid4())
        response = self.client.post("/rag/index", json={
            "organizationId": organization,
            "documentId": document,
            "versionId": version,
            "allowedUserIds": [user],
            "chunks": [
                {"text": "مبلغ قرارداد ۱۵٬۰۰۰٬۰۰۰٬۰۰۰ ریال است", "page": 3},
                {"text": "مبلغ قرارداد 12000000000 ریال است", "page": 4},
            ],
        })
        self.assertEqual(200, response.status_code, response.text)

        response = self.client.post("/rag/search", json={
            "organizationId": organization,
            "userId": user,
            "query": "مبلغ 15000000000 ریال",
            "limit": 2,
        })
        self.assertEqual(200, response.status_code, response.text)
        results = response.json()["results"]
        self.assertEqual(3, results[0]["citation"]["page"])
        self.assertGreater(results[0]["score"], results[1]["score"])

    def test_acl_rejects_other_user_and_allows_group_member(self):
        organization = str(uuid4())
        document = str(uuid4())
        version = str(uuid4())
        response = self.client.post("/rag/index", json={
            "organizationId": organization,
            "documentId": document,
            "versionId": version,
            "allowedUserIds": ["owner"],
            "allowedGroupIds": ["legal-team"],
            "chunks": [{"text": "تعهد محرمانه داوری", "page": 2}],
        })
        self.assertEqual(200, response.status_code, response.text)

        denied = self.client.post("/rag/search", json={
            "organizationId": organization,
            "userId": "other-user",
            "query": "تعهد داوری",
        })
        self.assertEqual(200, denied.status_code, denied.text)
        self.assertEqual([], denied.json()["results"])

        allowed = self.client.post("/rag/search", json={
            "organizationId": organization,
            "userId": "other-user",
            "groupIds": ["legal-team"],
            "query": "تعهد داوری",
        })
        self.assertEqual(200, allowed.status_code, allowed.text)
        self.assertEqual(document, allowed.json()["results"][0]["citation"]["documentId"])

    def test_organization_scope_is_available_to_any_user_in_same_tenant(self):
        organization = str(uuid4())
        response = self.client.post("/rag/index", json={
            "organizationId": organization,
            "documentId": str(uuid4()),
            "versionId": str(uuid4()),
            "accessScope": "organization",
            "chunks": [{"text": "آیین نامه عمومی سازمان"}],
        })
        self.assertEqual(200, response.status_code, response.text)
        found = self.client.post("/rag/search", json={
            "organizationId": organization,
            "userId": "member",
            "query": "آیین نامه",
        })
        self.assertEqual(1, len(found.json()["results"]))

    def test_pipeline_uses_ocr_for_a_scanned_pdf_page(self):
        writer = PdfWriter()
        writer.add_blank_page(width=300, height=300)
        stream = BytesIO()
        writer.write(stream)
        payload = {
            "organizationId": str(uuid4()),
            "documentId": str(uuid4()),
            "versionId": str(uuid4()),
            "allowedUserIds": ["owner"],
            "fileName": "scan.pdf",
            "contentBase64": base64.b64encode(stream.getvalue()).decode("ascii"),
        }
        with patch.object(self.module, "ocr_pdf_page",
                          return_value="ماده ۱ مبلغ قرارداد ۱۵۰۰۰ ریال است"):
            response = self.client.post("/pipeline/process", json=payload)
        self.assertEqual(200, response.status_code, response.text)
        result = response.json()
        self.assertEqual("ready", result["status"])
        self.assertEqual(1, result["ocrPageCount"])
        self.assertEqual(1, result["chunkCount"])

    def test_search_requires_user_context(self):
        response = self.client.post("/rag/search", json={
            "organizationId": str(uuid4()),
            "query": "محرمانه",
        })
        self.assertEqual(422, response.status_code)


if __name__ == "__main__":
    unittest.main()
