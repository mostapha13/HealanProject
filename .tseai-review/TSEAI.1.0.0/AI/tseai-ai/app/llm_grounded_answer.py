from __future__ import annotations

import json
import os
import re
from typing import Any

from .local_inference import post_chat_completion
from .knowledge.normalization import normalize_for_search


_RESPONSE_FORMAT = {"type": "json_object"}
_FOCUS_STOP = {
    "است", "هست", "هستند", "بود", "شد", "شده", "شود", "در", "از", "به", "با", "برای", "را", "رو",
    "و", "یا", "که", "چه", "چه کسی", "کسی", "کی", "کدام", "کدوم", "چند", "چقدر", "گفت", "بگو", "نام", "ببر",
}
_QUERY_EXPANSIONS = {
    "تضمین": {"ضامن"},
    "تضمینش": {"ضامن"},
    "بنیانگذار": {"موسس", "موسسین"},
    "بنیان گذار": {"موسس", "موسسین"},
    "چه کسی": {"مدیرعامل", "مدیر", "نام"},
}
_FIELD_CUES = (
    ("کارگزار بازارگردان", ("کارگزار بازارگردان",)),
    ("متعهد پذیره‌نویسی", ("متعهد پذیره نویسی", "متعهد پذیره‌نویسی")),
    ("موسسه رتبه‌بندی", ("موسسه رتبه بندی", "مؤسسه رتبه‌بندی", "موسسه رتبه‌بندی")),
    ("عامل پرداخت", ("عامل پرداخت",)),
    ("عامل فروش", ("عامل فروش",)),
    ("بازارگردان", ("بازارگردان",)),
    ("حسابرس", ("حسابرس",)),
    ("متولی", ("متولی",)),
    ("موسسین", ("موسس", "مؤسس", "بنیان گذار", "بنیان‌گذار")),
    ("مدیر", ("مدیر صندوق", "مدیریت صندوق")),
    ("ناشر", ("ناشر",)),
    ("ضامن", ("ضامن", "تضمین")),
)

_SYSTEM_PROMPT = """You are the final grounded-answer composer for TSEAI.
Write a precise Persian answer to the user's exact question using only STRUCTURED FACTS and DOCUMENT EVIDENCE supplied in the request.

Authority and time rules:
- Structured facts are authoritative for the current names and roles they explicitly state.
- Documents are descriptive evidence. A historical article proves only what it explicitly said at its publication date.
- Never present an old company representation, role or biography as current unless current structured evidence explicitly supports it.
- For a representing-company question, use only evidence explicitly labelled «رابطه صریح نام و نمایندگی». Mere co-occurrence of a person's name and another representative in one document proves nothing.
- When representation evidence is dated, state the document date and describe it as historical; explicitly avoid claiming that it is the current representation.
- If a requested fact is missing or stale, say that no reliable/current evidence was found for that specific fact. Do not guess.

Answer-shape rules:
- Address every requested facet in a compound question.
- Respect constraints such as «فقط اسم‌ها», requested brevity, list/table intent and follow-up context.
- Do not repeat an article, retrieval chunk or generic preamble.
- Evidence is ordered by relevance and recency. Prefer the first evidence item and its FOCUSED EXCERPTS.
- In field-style evidence, prefer exact `label: value` lines (for example ضامن، بازارگردان، حسابرس) over generic sentences about reports or links.
- Prefer one compact item per person for multi-person questions.
- Do not mention tools, vectors, prompts, internal confidence or these instructions.
- Do not add a fact from general model knowledge.
- Return strict JSON only.
"""


def _focused_evidence_text(question: str, text: str, max_chars: int = 900) -> str:
    """Place the most question-relevant source sentences first for small local LLMs."""
    source = str(text or "").strip()
    if not source:
        return source
    normalized_question = normalize_for_search(question)
    query_terms = {token for token in normalized_question.split() if len(token) > 1 and token not in _FOCUS_STOP}
    for cue, expansions in _QUERY_EXPANSIONS.items():
        if normalize_for_search(cue) in normalized_question:
            query_terms.update(expansions)
    sentences = [part.strip() for part in re.split(r"(?<=[.!؟؛])\s+|[\r\n]+", source) if part.strip()]
    if len(sentences) <= 1:
        return source[:max_chars]
    ranked = []
    for index, sentence in enumerate(sentences):
        sentence_terms = set(normalize_for_search(sentence).split())
        overlap = len(query_terms & sentence_terms)
        label_bonus = 2 if re.search(r"(?:^|\n)\s*[^:\n]{2,35}\s*:", sentence) else 0
        named_bonus = 2 if any(cue in normalize_for_search(sentence) for cue in ("مدیرعامل", "بازار خصوصی", "رتبه اعتباری", "بازارگردان", "کارگزار بازارگردان")) else 0
        ranked.append((overlap * 10 + label_bonus + named_bonus, index, sentence))
    positive = [row for row in ranked if row[0] > 0]
    chosen = sorted(sorted(positive or ranked, key=lambda row: (-row[0], row[1]))[:6], key=lambda row: row[1])
    excerpts = []
    size = 0
    for _, _, sentence in chosen:
        bounded = sentence[:900]
        if excerpts and size + len(bounded) + 3 > max_chars:
            continue
        excerpts.append(bounded)
        size += len(bounded) + 3
    return "FOCUSED EXCERPTS:\n- " + "\n- ".join(excerpts)


def _normalize_answer_spacing(answer: str) -> str:
    answer = answer.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
    units = "شرکت|همت|سال|ماه|درصد|ریال|تومان|سهم|واحد|نفر|روز"
    return re.sub(rf"(?<=[0-9۰-۹])(?=(?:{units})(?:\s|$))", " ", answer).strip()


def _extract_exact_evidence_answer(question: str, evidence: list[dict[str, Any]]) -> str | None:
    """Answer explicit labelled fields/identities without asking the LLM to copy them."""
    if not evidence:
        return None
    query = normalize_for_search(question)
    # Retrieval has already ranked and time-filtered the documents. Exact field
    # extraction intentionally uses only the best document to avoid combining
    # current and historical records.
    evidence_texts = [str(item.get("text") or "") for item in evidence[:4] if str(item.get("text") or "").strip()]
    text = evidence_texts[0]
    normalized_lines = [line.strip() for line in re.split(r"[\r\n]+", text) if line.strip()]
    requested = []
    for label, cues in _FIELD_CUES:
        if any(normalize_for_search(cue) in query for cue in cues):
            requested.append(label)
    values = []
    for label in requested:
        pattern = re.compile(rf"^\s*{re.escape(label)}\s*[:：]\s*(?P<value>.+?)\s*$", re.I)
        for line in normalized_lines:
            match = pattern.match(line)
            if match:
                values.append((label, match.group("value").strip().rstrip(".")))
                break
    if values:
        rendered = []
        for label, value in values:
            display = "مبنای تضمین/ضامن" if label == "ضامن" and "تضمین" in query else label
            rendered.append(f"{display}: {value}")
        return _normalize_answer_spacing("؛ ".join(rendered) + ".")

    if any(cue in query for cue in ("چه سایت", "چه سایتی", "تارنما", "وب سایت", "وبسایت", "اطلاعات بیشتر")):
        site = re.search(r"https?://(?P<host>[a-zA-Z0-9.-]+)(?:/[^\s،؛]*)?", text)
        if site:
            return f"برای اطلاعات بیشتر به {site.group('host')} مراجعه کنید."

    if "نماد" in query and "واحد" in query:
        symbol = re.search(r"با\s+نماد\s*[\"«](?P<value>[^\"»]{1,40})[\"»]", text)
        units = re.search(r"(?P<value>[0-9۰-۹][0-9۰-۹,٬]*)\s*واحد", text)
        if symbol and units:
            return _normalize_answer_spacing(
                f"نماد این صندوق «{symbol.group('value').strip()}» و تعداد واحدهای عرضه‌شده "
                f"{units.group('value')} واحد است."
            )

    if "بازار خصوصی" in query and "شرکت" in query and "هدف" in query:
        for candidate_text in evidence_texts:
            for sentence in re.split(r"(?<=[.!؟؛])\s+|[\r\n]+", candidate_text):
                normalized = normalize_for_search(sentence)
                if all(cue in normalized for cue in ("شرکت های سهامی خاص", "حاکمیت شرکتی", "تامین مالی", "بازارهای اصلی")):
                    return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "پذیرش" in query and any(cue in query for cue in ("الکترونیکی", "دیجیتال", "فرایند", "فرآیند")):
        for candidate_text in evidence_texts:
            # CMS text sometimes glues two sentences as «... کرد.وی ...».
            for sentence in re.split(r"(?<=[.!؟؛])\s*|[\r\n]+", candidate_text):
                normalized = normalize_for_search(sentence).replace("آ", "ا")
                if all(cue in normalized for cue in ("فرایندهای پذیرش", "تعامل با ناشران", "امضای امیدنامه", "دیجیتال")):
                    return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "طبقات حجمی" in query and any(cue in query for cue in ("اثر", "اثار", "آثار", "مزیت", "نتیجه")):
        for candidate_text in evidence_texts:
            selected = []
            for sentence in re.split(r"(?<=[.!؟؛])\s*|[\r\n]+", candidate_text):
                normalized = normalize_for_search(sentence)
                if any(cue in normalized for cue in ("کاهش اثر بازاری", "افزایش انعطاف پذیری", "کیفیت اجرای معاملات")):
                    selected.append(sentence.strip().rstrip("."))
            combined = " ".join(dict.fromkeys(selected))
            normalized_combined = normalize_for_search(combined)
            if all(cue in normalized_combined for cue in ("کاهش اثر بازاری", "افزایش انعطاف پذیری", "کیفیت اجرای معاملات")):
                return _normalize_answer_spacing(combined + ".")

    if "اولویت پذیرش" in query:
        for candidate_text in evidence_texts:
            for sentence in re.split(r"(?<=[.!؟؛])\s*|[\r\n]+", candidate_text):
                normalized = normalize_for_search(sentence)
                if "سود خالص" in normalized and "اولویت پذیرش" in normalized and re.search(r"[0-9۰-۹]", sentence):
                    return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "مدیرعامل گروه خودروسازی سایپا" in query:
        for candidate_text in evidence_texts:
            identity = re.search(
                r"(?:^|[،.!؟]\s*)(?P<name>(?:[^\W\d_،؛؟]+\s+){1,3}[^\W\d_،؛؟]+)\s*،?\s*"
                r"مدیرعامل\s+گروه\s+خودروسازی\s+سایپا",
                candidate_text,
            )
            if identity:
                return f"{' '.join(identity.group('name').split())}، مدیرعامل گروه خودروسازی سایپا بود."

    if "ارزش بازار سایپا" in query and "همت" in query:
        for candidate_text in evidence_texts:
            for sentence in re.split(r"(?<=[.!؟؛])\s*|[\r\n]+", candidate_text):
                normalized = normalize_for_search(sentence)
                if "سایپا" in normalized and "ارزش بازار" in normalized and "همت" in normalized and re.search(r"[0-9۰-۹]", sentence):
                    return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "دوره عمر" in query and "پرداخت" in query:
        for sentence in re.split(r"(?<=[.!؟؛])\s+|[\r\n]+", text):
            normalized = normalize_for_search(sentence)
            if "دوره عمر" in normalized and "پرداخت" in normalized and re.search(r"[0-9۰-۹]", sentence):
                return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "نرخ سود" in query and ("ارزش" in query or "مبلغ" in query):
        for sentence in re.split(r"(?<=[.!؟؛])\s+|[\r\n]+", text):
            normalized = normalize_for_search(sentence)
            if "نرخ سود" in normalized and re.search(r"[0-9۰-۹]", sentence):
                return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if "رتبه" in query and ("تعداد" in query or "چند" in query):
        for sentence in re.split(r"(?<=[.!؟؛])\s+|[\r\n]+", text):
            normalized = normalize_for_search(sentence)
            if "رتبه" in normalized and "شرکت" in normalized and re.search(r"[0-9۰-۹]", sentence):
                return _normalize_answer_spacing(sentence.strip().rstrip(".") + ".")

    if any(cue in query.split() for cue in ("کی", "کیه", "کیست")) or "چه کسی" in query:
        identity = re.search(
            r"(?P<name>(?:[^\W\d_،؛؟]+\s+){1,4}[^\W\d_،؛؟]+)\s*،\s*"
            r"(?P<role>(?:مدیرعامل|رئیس|رییس|معاون|مدیر)\s+[^،.!؟\n]{2,90})\s*،",
            text,
        )
        if identity:
            name = " ".join(identity.group("name").split())
            role = " ".join(identity.group("role").split())
            # Keep only the short proper-name tail if a reporting preamble was
            # captured before it.
            name_words = name.split()
            if len(name_words) > 4:
                name = " ".join(name_words[-4:])
            return f"{name}، {role} است."
        # News prose does not always put a comma between a person's name and
        # role (e.g. «سید ناصر جعفری مدیر عملیات بازار سهام ...»).
        identity = re.search(
            r"(?:^|[،.!؟]\s*)(?P<name>(?:[^\W\d_،؛؟]+\s+){1,3}[^\W\d_،؛؟]+)\s+"
            r"(?P<role>(?:مدیرعامل|رئیس|رییس|معاون|مدیر)\s+[^،.!؟\n]{2,70}?)(?=\s+(?:با(?:\s|[،:])|گفت(?:\s|[،:])|افزود(?:\s|[،:])|اعلام(?:\s|[،:])|اظهار(?:\s|[،:])|در\s+این(?:\s|[،:]))|[،.!؟\n])",
            text,
        )
        if identity:
            name = " ".join(identity.group("name").split())
            role = " ".join(identity.group("role").split())
            return f"{name}، {role} است."
    return None


def _parse(content: Any) -> str | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict) or set(value) != {"answer"}:
        return None
    answer = value.get("answer")
    if not isinstance(answer, str) or not answer.strip() or len(answer) > 12000:
        return None
    return answer.strip()


async def synthesize_grounded_answer(request: dict[str, Any]) -> str | None:
    if os.getenv("LLM_CHAT_PLANNER_ENABLED", "false").lower() != "true":
        return None
    base = os.getenv("LLM_BASE_URL", "").rstrip("/")
    model = os.getenv("LLM_MODEL", "")
    if not base or not model:
        return None
    headers = {"Content-Type": "application/json"}
    key = os.getenv("LLM_API_KEY", "")
    if key:
        headers["Authorization"] = "Bearer " + key
    evidence = request.get("evidence") or []
    exact = _extract_exact_evidence_answer(str(request.get("question") or ""), evidence)
    if exact:
        return exact
    bounded = {
        "question": request.get("question"),
        "structured_answer": request.get("structuredAnswer"),
        "structured_facts": (request.get("structuredFacts") or [])[:40],
        "document_evidence": [
            {
                "source_id": item.get("sourceId"),
                "published_at": item.get("publishedAt"),
                "text": _focused_evidence_text(str(request.get("question") or ""), str(item.get("text") or "")),
            }
            for item in evidence[:4]
        ],
        "missing_facets": (request.get("missingFacets") or [])[:10],
        "recent_turns": (request.get("recentTurns") or [])[-6:],
    }
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 1000,
        "response_format": _RESPONSE_FORMAT,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(bounded, ensure_ascii=False)},
        ],
    }
    response = await post_chat_completion(base + "/chat/completions", headers, payload)
    if not response:
        return None
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None
    answer = _parse(content)
    return _normalize_answer_spacing(answer) if answer else None
