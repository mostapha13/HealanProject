from app.conversation_filter_planner import interpret_conversation


def test_create_when_no_active_filter():
    p=interpret_conversation("ارزش معاملات بیشتر از 20 میلیارد ریال",None,[])
    assert p.status=="ok" and p.operation=="create"
    assert p.tsetmc_code=="(tval) > 20000000000"


def test_add_to_existing_filter():
    p=interpret_conversation("صف خرید هم اضافه کن","(pl) > (pc)",["(pl) > (pc)"])
    assert p.status=="ok" and p.operation=="add"
    assert "(pd1) == (tmax)" in p.tsetmc_code


def test_remove_second_condition():
    p=interpret_conversation("شرط دوم را حذف کن","(pl) > (pc) && (tval) > 20000000000",["(pl) > (pc)","(tval) > 20000000000"])
    assert p.operation=="remove_condition" and p.condition_index==2


def test_remove_trade_value_by_name():
    p=interpret_conversation("شرط ارزش معاملات را حذف کن","(pl) > (pc) && (tval) > 20000000000",["(pl) > (pc)","(tval) > 20000000000"])
    assert p.operation=="remove_field" and p.field_code=="tval"


def test_remove_buy_queue_group():
    conditions=["(pl) > (pc)","(pd1) == (tmax)","(qd1) >= 200000000"]
    p=interpret_conversation("صف خرید را حذف کن"," && ".join(conditions),conditions)
    assert p.operation=="replace_all"
    assert p.tsetmc_code=="(pl) > (pc)"


def test_change_last_trade_value_to_30_billion_irr():
    conditions=["(pl) > (pc)","(tval) > 20000000000"]
    p=interpret_conversation("حدش را 30 میلیارد ریال کن"," && ".join(conditions),conditions)
    assert p.operation=="replace_condition" and p.condition_index==2
    assert p.tsetmc_code=="(tval) > 30000000000"


def test_change_trade_value_toman_is_converted_to_irr():
    conditions=["(tval) > 20000000000"]
    p=interpret_conversation("ارزش معاملات رو 30 میلیارد تومان کن",conditions[0],conditions)
    assert p.operation=="replace_condition"
    assert p.tsetmc_code=="(tval) > 300000000000"


def test_undo_redo_show_clear():
    code="(pl) > (pc)"
    conditions=[code]
    assert interpret_conversation("یک مرحله برگرد",code,conditions).operation=="undo"
    assert interpret_conversation("دوباره اعمال کن",code,conditions).operation=="redo"
    assert interpret_conversation("فیلتر فعلی رو نشون بده",code,conditions).operation=="show"
    assert interpret_conversation("کل فیلتر رو پاک کن",code,conditions).operation=="clear"


def test_change_buy_queue_volume_uses_share_scale_not_money():
    conditions=["(pd1) == (tmax)","(qd1) >= 200000000"]
    p=interpret_conversation("حجم صف رو 300 میلیون کن"," && ".join(conditions),conditions)
    assert p.operation=="replace_condition" and p.condition_index==2
    assert p.tsetmc_code=="(qd1) >= 300000000"


def test_contextual_buyer_power_defaults_to_individual_in_filter_conversation():
    current="(tval) > 20000000000"
    p=interpret_conversation("قدرت خرید رو هم بالای 2 بذار",current,[current])
    assert p.operation=="add"
    assert "(ct).Buy_CountI > 0" in p.tsetmc_code
    assert ">= 2*" in p.tsetmc_code


def test_explain_current_filter():
    code="(pe) < 6 && (tvol) > 1000000"
    p=interpret_conversation("فیلتر رو توضیح بده",code,["(pe) < 6","(tvol) > 1000000"])
    assert p.operation=="explain"

def test_execute_current_filter():
    code="(pe) < 6"
    p=interpret_conversation("همین رو اجرا کن",code,[code])
    assert p.operation=="execute"

def test_replace_pe_by_field_name():
    conditions=["(pe) < 6","(tvol) > 1000000"]
    p=interpret_conversation("P/E رو زیر 5 کن"," && ".join(conditions),conditions)
    assert p.operation=="replace_condition"
    assert p.condition_index==1
    assert "(pe) < 5" in p.tsetmc_code

def test_replace_condition_with_explicit_dsl():
    conditions=["(pe) < 6","(tvol) > 1000000"]
    p=interpret_conversation("شرط دوم را با (pl) > (pc) جایگزین کن"," && ".join(conditions),conditions)
    assert p.operation=="replace_condition"
    assert p.condition_index==2
    assert p.tsetmc_code=="(pl) > (pc)"

def test_word_number_replacement():
    conditions=["(pe) < 6"]
    p=interpret_conversation("P/E رو زیر پنج کن",conditions[0],conditions)
    assert p.operation=="replace_condition"
    assert "(pe) < 5" in p.tsetmc_code
