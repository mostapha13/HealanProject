from app.filter_planner import interpret_filter


def test_client_volume_ratio():
    plan = interpret_filter("حجم خرید حقیقی دو برابر حجم فروش حقیقی")
    assert plan.status == "ok"
    assert "(ct).Buy_I_Volume >= 2 * (ct).Sell_I_Volume" in plan.tsetmc_code


def test_three_times_client_volume_ratio():
    plan = interpret_filter("حجم خرید حقیقی سه برابر حجم فروش حقیقی")
    assert "3 * (ct).Sell_I_Volume" in plan.tsetmc_code


def test_toman_is_converted_to_irr():
    plan = interpret_filter("ارزش معاملات بیشتر از 20 میلیارد تومان")
    assert "(tval) > 200000000000" in plan.tsetmc_code


def test_unspecified_money_unit_defaults_to_irr():
    plan = interpret_filter("ارزش معاملات بیشتر از 20 میلیارد")
    assert "(tval) > 20000000000" in plan.tsetmc_code


def test_combined_buy_queue_and_trade_value():
    plan = interpret_filter("صف خرید با حجم بالای 200 میلیون سهم و ارزش معاملات بیشتر از 20 میلیارد ریال")
    assert plan.status == "ok"
    assert "(pd1) == (tmax)" in plan.tsetmc_code
    assert "(qd1) >= 200000000" in plan.tsetmc_code
    assert "(tval) > 20000000000" in plan.tsetmc_code


def test_buyer_power_guards_zero_counts():
    plan = interpret_filter("قدرت خرید حقیقی بیشتر از 3")
    assert plan.status == "ok"
    assert "(ct).Buy_CountI > 0" in plan.tsetmc_code
    assert "(ct).Sell_CountI > 0" in plan.tsetmc_code
    assert ">= 3*" in plan.tsetmc_code


def test_unsupported_history_request_fails_closed():
    plan = interpret_filter("صف خرید و RSI بالای 70")
    assert plan.status == "no_match"
    assert plan.tsetmc_code is None


def test_unrecognized_clause_does_not_get_silently_dropped():
    plan = interpret_filter("ارزش معاملات بیشتر از 20 میلیارد ریال و خبر خوب داشته باشد")
    assert plan.status == "no_match"
    assert plan.tsetmc_code is None


def test_symbol_prefix_uses_tsetmc_l18():
    plan = interpret_filter('نمادهایی که با "ف" شروع می شوند')
    assert plan.status == "ok"
    assert '(l18).indexOf("ف") == 0' in plan.tsetmc_code


def test_trade_count_limit():
    plan = interpret_filter("تعداد معاملات بیشتر از 20")
    assert plan.status == "ok"
    assert "(tno) > 20" in plan.tsetmc_code
