from app.chat_reflection import reflect_chat

def test_reflection_requests_more_evidence_for_empty_hybrid():
    r=reflect_chat("فولاد چرا مثبت است؟","x","hybrid",0.8,0,[])
    assert r.action=="retrieve_more"

def test_reflection_clarifies_on_low_confidence():
    r=reflect_chat("؟","x","knowledge",0.2,3,[])
    assert r.action=="clarify"

def test_reflection_accepts_sufficient_evidence():
    r=reflect_chat("خبر فولاد","x","knowledge",0.9,3,[])
    assert r.action=="accept"
