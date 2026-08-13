from dataclasses import dataclass

@dataclass
class ReflectionDecision:
    action: str
    improved_query: str|None
    clarification: str|None
    reasons: list[str]

def reflect_chat(question:str, answer:str, intent:str, confidence:float, evidence_count:int, failed_tools:list[str])->ReflectionDecision:
    """Bounded, deterministic first-pass reflection. It never executes tools."""
    if failed_tools:
        return ReflectionDecision("clarify", None, "بخشی از ابزارهای لازم برای پاسخ در دسترس نبود. لطفاً دوباره تلاش کنید یا سؤال را محدودتر کنید.", ["tool_failure"])
    if confidence < 0.45:
        return ReflectionDecision("clarify", None, "منظور سؤال با اطمینان کافی تشخیص داده نشد؛ لطفاً نماد یا موضوع را دقیق‌تر مشخص کنید.", ["low_confidence"])
    if intent.lower() in ("knowledge","hybrid") and evidence_count == 0:
        return ReflectionDecision("retrieve_more", question, None, ["missing_evidence"])
    if intent.lower()=="hybrid" and evidence_count < 2:
        return ReflectionDecision("retrieve_more", question, None, ["thin_hybrid_evidence"])
    return ReflectionDecision("accept", None, None, ["sufficient_evidence"])
