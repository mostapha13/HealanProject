from app.rag.intent import detect_intent


def test_appointment_intent_not_doctor():
    intent = detect_intent("نوبت خالی پزشک قبل امروز")
    assert intent.record_types == ["نوبت"]
    assert intent.wants_empty_slot
    assert intent.date_relation == "before_today"


def test_doctor_intent():
    intent = detect_intent("دکتر قلب در ونک")
    assert intent.record_types == ["پزشک"]
