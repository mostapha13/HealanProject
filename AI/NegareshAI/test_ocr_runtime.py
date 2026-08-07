"""Docker acceptance test that exercises the real Tesseract OCR binary."""
from io import BytesIO
import unittest

from PIL import Image, ImageDraw, ImageFont

import main


class OcrRuntimeTests(unittest.TestCase):
    def test_broken_font_mapped_persian_requests_ocr(self):
        broken = "۳ ۲ سرمایه گذاری سهر ety Dam investment شب 5 ات پذیرش se هب"
        self.assertTrue(main.needs_ocr(broken))

    def test_readable_persian_does_not_request_ocr(self):
        readable = "امیدنامه پذیرش و درج شرکت سرمایه‌گذاری در بازار دوم فرابورس ایران"
        self.assertFalse(main.needs_ocr(readable))

    def test_scanned_pdf_is_ocrd_with_page_metadata(self):
        image = Image.new("RGB", (1800, 500), "white")
        draw = ImageDraw.Draw(image)
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 72)
        draw.text((80, 80), "Contract amount 15000000000 IRR", fill="black", font=font)
        draw.text((80, 200), "مبلغ قرارداد ۱۵۰۰۰۰۰۰۰۰۰ ریال", fill="black", font=font)
        pdf = BytesIO()
        image.save(pdf, format="PDF", resolution=200)

        pages = main.extract_pages(pdf.getvalue(), "scanned.pdf")

        self.assertEqual(1, len(pages))
        self.assertTrue(pages[0]["ocr"])
        normalized = main.normalize_persian(pages[0]["text"])
        self.assertIn("15000000000", normalized)
        self.assertEqual(1, pages[0]["page"])


if __name__ == "__main__":
    unittest.main()
