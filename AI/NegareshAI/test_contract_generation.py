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

    def test_real_contract_without_placeholders_updates_dates_amount_and_currency(self):
        template = Document()
        template.add_paragraph("از تاریخ 01/01/1404 لغایت 29/12/1404 به مدت 1 سال شمسی می‌باشد.")
        template.add_paragraph("مبلغ قرارداد سالیانه 19.000.000.000 ریال می‌باشد.")
        template.add_paragraph("01/01/1404 نیمی از مبلغ قرارداد در تاریخ عقد قرارداد")
        template.add_paragraph("نیمی از مبلغ قرارداد شش ماه بعد در تاریخ 01/06/1404")
        content = BytesIO()
        template.save(content)

        response = self.client.post("/contract/generate", files={
            "file": ("template.docx", content.getvalue(),
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }, data={"values": '{"startDate":"1405/01/01","endDate":"1405/12/29",'
                                '"amount":"18,750,000,000","currency":"IRR"}'})

        self.assertEqual(200, response.status_code)
        generated = Document(BytesIO(response.content))
        text = "\n".join(paragraph.text for paragraph in generated.paragraphs)
        self.assertIn("01/01/1405", text)
        self.assertIn("29/12/1405", text)
        self.assertIn("01/07/1405", text)
        self.assertIn("18,750,000,000 ریال", text)
        self.assertNotIn("19.000.000.000", text)
        self.assertNotIn("IRR", text)

    def test_fasa_literal_template_fields_are_all_filled(self):
        template = Document()
        template.add_paragraph("شرکت فسا شماره ملی فیلد1 تلفن فیلد2 آدرس فیلد3")
        template.add_paragraph("نماینده فیلد4 فیلد5 ملی فیلد6 پدر فیلد7 تلفن فیلد8 آدرس فیلد9")
        template.add_paragraph("قیلد1")
        template.add_paragraph("از تاریخ قیلد2 لغایت قیلد3 به مدت قیلد4 شمسی")
        template.add_paragraph("مبلغ قرارداد سالیانه قیلد5 ریال")
        template.add_paragraph("قیلد6")
        template.add_paragraph("مراجعه قیلد7 ریال و مالیات قیلد8 درصد")
        template.add_paragraph("در قیلد9 ماده در تاریخ میلد1 در شهر میلد2")
        template.add_paragraph("میلد3 میلد4 میلد5")
        content = BytesIO()
        template.save(content)
        response = self.client.post("/contract/generate", files={
            "file": ("Template.docx", content.getvalue(),
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }, data={"values": '{"subject":"قرارداد پشتیبانی فسا","partyName":"شرکت فسا",'
                                '"startDate":"1402/01/01","endDate":"1402/12/29",'
                                '"amount":"6,000,000,000","currency":"ریال",'
                                '"signingDate":"1405/05/15"}'})
        self.assertEqual(200, response.status_code)
        generated = Document(BytesIO(response.content))
        text = "\n".join(paragraph.text for paragraph in generated.paragraphs)
        self.assertNotRegex(text, r"(?:فیلد|قیلد)[1-9]|میلد[1-5]")
        self.assertIn("1402/01/01", text)
        self.assertIn("1402/12/29", text)
        self.assertIn("6,000,000,000 ریال", text)
        self.assertIn("15/05/1405", text)


if __name__ == "__main__":
    unittest.main()
