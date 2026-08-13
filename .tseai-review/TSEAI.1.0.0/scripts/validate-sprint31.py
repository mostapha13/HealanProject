from pathlib import Path
import json,sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(p,*xs):
 t=(r/p).read_text(encoding="utf-8",errors="ignore") if (r/p).exists() else ""; checks.append((p,all(x in t for x in xs)))
need("Backend/Platform/src/TSEAI.Application/Chat/AnswerValidationContracts.cs","DeterministicAnswerValidationGuard","numeric_claim_without_authoritative_evidence","market_answer_without_structured_fact","hybrid_answer_without_knowledge")
need("Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs","AnswerValidationReport? AnswerValidation")
need("Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs","answer.validate","answer_validation_blocked","IAnswerValidationGuard")
need("Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs","IAnswerValidationGuard, DeterministicAnswerValidationGuard")
checks.append(("cases",len(json.loads((r/"tests/answer-validation-cases.json").read_text(encoding="utf-8")))>=8))
checks.append(("version",(r/"VERSION").read_text().strip()>="1.0.0-rc.20"))
for n,o in checks: print("PASS" if o else "FAIL",n)
if not all(o for _,o in checks): sys.exit(1)
print("Sprint 31 validator PASS")
