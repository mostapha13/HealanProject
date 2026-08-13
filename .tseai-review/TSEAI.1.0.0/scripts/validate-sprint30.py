from pathlib import Path
import json,sys,re
r=Path(__file__).resolve().parents[1]
checks=[]
def need(path, needles):
    p=r/path; ok=p.exists(); txt=p.read_text(encoding='utf-8',errors='ignore') if ok else ''
    for n in needles: ok=ok and n in txt
    checks.append((str(path),ok))
need(Path('Backend/Platform/src/TSEAI.Application/Chat/EvidenceContracts.cs'),[
    'ChatEvidenceItem','EvidenceAuthority','CanonicalMarketSnapshot','QdrantGroundedEvidence','DeterministicCalculation','citation_label_without_evidence','unknown_source_id'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs'),['EvidenceValidationReport','IReadOnlyList<ChatEvidenceItem>? Evidence'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),['IChatEvidenceEngine evidenceEngine','EvidenceValidation','answer_validation_blocked'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/PersianFinancialAnswerComposer.cs'),['[M1]','[K{i+1}]'])
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),['IChatEvidenceEngine, ChatEvidenceEngine'])
need(Path('Backend/Platform/tests/TSEAI.EvidenceCitation.SmokeTests/Program.cs'),['unknown citation must fail','zero-row query execution evidence','M1','K1','Q1'])
need(Path('TSEAI.sln'),['TSEAI.EvidenceCitation.SmokeTests'])
need(Path('scripts/release-gate.sh'),['validate-sprint30.py','run-dotnet-smoke.py'])
need(Path('scripts/RELEASE-GATE.cmd'),['validate-sprint30.py','run-dotnet-smoke.py'])
cases=json.loads((r/'tests/evidence-citation-cases.json').read_text(encoding='utf-8'))
checks.append(('evidence-citation-corpus',len(cases)>=8))
version=(r/'VERSION').read_text().strip(); checks.append(('version-rc19+',version.startswith('1.0.0-rc.') and version.rsplit('.',1)[-1].isdigit() and int(version.rsplit('.',1)[-1])>=19))
failed=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL'),n)
if failed: sys.exit(1)
print('Sprint 30 validator PASS')
