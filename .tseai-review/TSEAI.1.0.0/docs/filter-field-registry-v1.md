# TSETMC Filter Field Registry — V1 Today
Supported groups: `(l18)`, `(l30)`, prices `(py)/(pf)/(pmin)/(pmax)/(pl)/(pc)`, changes `(plc)/(plp)/(pcc)/(pcp)`, trades `(tno)/(tvol)/(tval)`, fundamentals `(eps)/(pe)/(z)/(mv)/(bvol)/(cs)`, limits `(tmin)/(tmax)`, order book `pd/zd/qd/po/zo/qo` levels 1..5, `(buyop)`, `(predtran)`, and `(ct)` client-type members.
V1 intentionally rejects `[ih]`, `[is*]`, `cfield*` and programming-mode `function/for/if` constructs; those are later compatibility layers.
