from pathlib import Path
import json,sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(p,*xs):
 t=(r/p).read_text(encoding="utf-8",errors="ignore") if (r/p).exists() else ""; checks.append((p,all(x in t for x in xs)))
need("Backend/Platform/src/TSEAI.Application/Chat/PersianFinancialAnswerComposer.cs","AnswerVerbosity","Compact","Analytical","ComposeComparison","ComposeStructured","[M1]","[K{i+1}]")
need("Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs","IPersianFinancialAnswerComposer answerComposer","DetectVerbosity")
need("Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs","IPersianFinancialAnswerComposer, PersianFinancialAnswerComposer")
checks.append(("cases",len(json.loads((r/"tests/persian-answer-composer-cases.json").read_text(encoding="utf-8")))>=8))
checks.append(("version",(r/"VERSION").read_text().strip()>="1.0.0-rc.21"))
for n,o in checks: print("PASS" if o else "FAIL",n)
if not all(o for _,o in checks): sys.exit(1)
print("Sprint 32 validator PASS")
