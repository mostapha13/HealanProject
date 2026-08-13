from pathlib import Path
import json,sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(path, needles):
    p=r/path; ok=p.exists(); txt=p.read_text(encoding='utf-8',errors='ignore') if ok else ''
    for n in needles: ok=ok and n in txt
    checks.append((str(path),ok))
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Context/ConversationTemporalContext.cs'),[
    'IConversationTemporalContextResolver','context.anchor_missing','RebaseToClock','explicit-temporal-comparison','conversation.last-temporal'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),[
    'conversationTemporal.ResolveAsync','temporalTurn.Comparison','RequiresHistoricalOrFutureMarketData(temporalContext,temporalTurn.Comparison)'])
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),[
    'IConversationTemporalContextResolver','ConversationTemporalContextResolver'])
need(Path('Backend/Platform/tests/TSEAI.TemporalConversation.SmokeTests/Program.cs'),[
    'یک روز بعدش','همون روز','context.anchor_missing','امروز رو با دیروز مقایسه کن','rebased to real clock'])
need(Path('TSEAI.sln'),['TSEAI.TemporalConversation.SmokeTests'])
need(Path('scripts/release-gate.sh'),['validate-sprint29.py','run-dotnet-smoke.py'])
need(Path('scripts/RELEASE-GATE.cmd'),['validate-sprint29.py','run-dotnet-smoke.py'])
cases=json.loads((r/'tests/temporal-conversation-cases.json').read_text(encoding='utf-8'))
checks.append(('temporal-conversation-corpus',len(cases)>=8))
version=(r/'VERSION').read_text(encoding='utf-8').strip()
m=__import__('re').match(r'1\.0\.0-rc\.(\d+)$',version); checks.append(('version-min-rc18',bool(m) and int(m.group(1))>=18))
failed=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL'),n)
if failed: sys.exit(1)
print('Sprint 29 validator PASS')
