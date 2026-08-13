from __future__ import annotations
import re

_ARABIC_TO_PERSIAN = str.maketrans({"ي":"ی","ى":"ی","ك":"ک","ۀ":"ه","ة":"ه","ؤ":"و","إ":"ا","أ":"ا"})
_SEARCH_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩","01234567890123456789")
_DIACRITICS = re.compile(r"[\u064b-\u065f\u0670\u06d6-\u06ed]")
_SPACES = re.compile(r"[ \t\r\f\v]+")
_BLANKS = re.compile(r"\n{3,}")

def normalize_persian(text: str) -> str:
    text=(text or "").translate(_ARABIC_TO_PERSIAN).replace("\u200c", " ")
    text=_DIACRITICS.sub("", text)
    text=_SPACES.sub(" ", text)
    text=_BLANKS.sub("\n\n", text)
    return text.strip()

def normalize_for_search(text: str) -> str:
    text=normalize_persian(text).translate(_SEARCH_DIGITS).lower()
    return re.sub(r"[^0-9a-zA-Z\u0600-\u06ff]+", " ", text).strip()
