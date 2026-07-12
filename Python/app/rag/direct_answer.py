"""پاسخ مستقیم از فیلد answer بدون LLM."""



from __future__ import annotations



import re



NO_ANSWER_MESSAGE = (

    "متأسفانه نمی‌توانم به این سوال پاسخ دهم. "

    "لطفاً سوال خود را ساده‌تر مطرح کنید یا با مطب تماس بگیرید."

)



INDEXING_MESSAGE = (

    "سرویس پاسخ‌گویی هوشمند در حال آماده‌سازی است. "

    "لطفاً چند لحظه دیگر دوباره تلاش کنید."

)





def _tokenize(text: str) -> list[str]:

    return re.findall(r"[\w\u0600-\u06FF]+", (text or "").lower())





def _keyword_overlap_score(query: str, text: str) -> float:

    query_tokens = _tokenize(query)

    if not query_tokens:

        return 0.0

    text_tokens = set(_tokenize(text))

    overlap = sum(1 for token in query_tokens if token in text_tokens)

    return overlap / len(query_tokens)





def _pick_keyword_hit(question: str, hits: list[dict], *, min_overlap: float) -> dict | None:

    best_hit: dict | None = None

    best_score = 0.0

    for hit in hits[:8]:

        content = str(hit.get("content") or "")

        meta = hit.get("metadata") or {}

        answer = str(meta.get("answer") or hit.get("content") or "").strip()

        if not answer:

            continue

        score = max(

            _keyword_overlap_score(question, content),

            _keyword_overlap_score(question, answer),

        )

        if score > best_score:

            best_score = score

            best_hit = hit

    if best_hit is not None and best_score >= min_overlap:

        best_hit = dict(best_hit)

        best_hit["score"] = round(best_score, 4)

        return best_hit

    return None





def ask_direct(

    hits: list[dict],

    *,

    question: str = "",

    similarity_threshold: float = 0.55,

) -> dict:

    if not hits:

        return {

            "answer": NO_ANSWER_MESSAGE,

            "was_answered": False,

            "similarity_score": None,

            "matched_id": None,

            "source_type": None,

            "sources": [],

            "model": "direct",

            "answer_mode": "direct",

        }



    best = hits[0]

    score = float(best.get("score") or 0)

    meta = best.get("metadata") or {}



    if score < similarity_threshold and question.strip():

        min_overlap = 0.5 if len(_tokenize(question)) <= 2 else 0.6

        keyword_hit = _pick_keyword_hit(question, hits, min_overlap=min_overlap)

        if keyword_hit is not None:

            best = keyword_hit

            score = float(best.get("score") or 0)

            meta = best.get("metadata") or {}



    if score < similarity_threshold:

        return {

            "answer": NO_ANSWER_MESSAGE,

            "was_answered": False,

            "similarity_score": score,

            "matched_id": meta.get("id"),

            "source_type": meta.get("source"),

            "sources": hits,

            "model": "direct",

            "answer_mode": "direct",

        }



    answer = (meta.get("answer") or best.get("content") or "").strip()

    if not answer:

        return {

            "answer": NO_ANSWER_MESSAGE,

            "was_answered": False,

            "similarity_score": score,

            "matched_id": meta.get("id"),

            "source_type": meta.get("source"),

            "sources": hits,

            "model": "direct",

            "answer_mode": "direct",

        }



    return {

        "answer": answer,

        "was_answered": True,

        "similarity_score": score,

        "matched_id": meta.get("id"),

        "source_type": meta.get("source"),

        "sources": hits,

        "model": "direct",

        "answer_mode": "direct",

    }


