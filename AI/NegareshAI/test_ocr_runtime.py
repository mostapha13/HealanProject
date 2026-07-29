"""Docker acceptance test that exercises the real Tesseract OCR binary."""
from io import BytesIO
import unittest

from PIL import Image, ImageDraw, ImageFont

import main


class OcrRuntimeTests(unittest.TestCase):
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
