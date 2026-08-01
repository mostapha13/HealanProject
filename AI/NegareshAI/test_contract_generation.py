import unittest
from io import BytesIO

from docx import Document
from fastapi.testclient import TestClient
from pypdf import PdfReader

from main import app


class ContractGenerationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_docx_template_replacement_and_source_backed_pdf(self):
        template = Document()
        template.add_paragraph("موضوع: {{subject}}")
        template.add_paragraph("مبلغ: {{amount}}")
        content = BytesIO()
        template.save(content)
        docx = self.client.post("/contract/generate", files={
            "file": ("template.docx", content.getvalue(),
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }, data={"values": '{"subject":"پشتیبانی فسا","amount":"130,000,000"}'})
        self.assertEqual(200, docx.status_code)
        generated = Document(BytesIO(docx.content))
        self.assertIn("پشتیبانی فسا", "\n".join(x.text for x in generated.paragraphs))

        pdf = self.client.post("/contract/pdf", json={
            "conversationId": "11111111-1111-1111-1111-111111111111",
            "draftVersion": 2,
            "subject": "پشتیبانی شرکت فسا",
            "partyName": "شرکت فسا",
            "startDate": "1405/01/01",
            "endDate": "1405/12/29",
            "amount": "130,000,000",
            "currency": "IRR",
            "newClause": "حل اختلاف از طریق شورای سازمان",
            "approvedClauses": "بند محرمانگی مصوب",
            "diffJson": "{}",
            "createdAtUtc": "2026-08-01T00:00:00Z",
            "citations": [{
                "documentTitle": "قرارداد نهایی 1404",
                "documentId": "22222222-2222-2222-2222-222222222222",
                "versionId": "33333333-3333-3333-3333-333333333333",
                "page": 4,
                "section": "مبلغ قرارداد",
                "evidence": "مبلغ قرارداد مرجع"
            }]
        })
        self.assertEqual(200, pdf.status_code)
        self.assertTrue(pdf.content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(PdfReader(BytesIO(pdf.content)).pages), 1)


if __name__ == "__main__":
    unittest.main()
