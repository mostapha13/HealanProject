from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(path, needles):
    p=r/path
    ok=p.exists()
    txt=p.read_text(encoding='utf-8',errors='ignore') if ok else ''
    for n in needles: ok=ok and n in txt
    checks.append((str(path),ok))
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Context/ConversationContextContracts.cs'),['IConversationContextStore','ConversationRouteHint','ConversationEntityReference'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Context/ConversationContextService.cs'),['comparison-uses-conversation-primary','knowledge-followup-with-primary-entity','explicit-correction-entity'])
need(Path('Backend/Platform/src/TSEAI.Infrastructure/Conversation/RedisConversationContextStore.cs'),['tseai:chat-context:v1','TimeSpan.FromHours(6)'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Routing/DeterministicCapabilityRouter.cs'),['MarketComparison','conversation-market-followup','RouteWithContextAsync'])
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),['conversation.context','ComposeComparison','MarketComparisonResult','ConversationContext'])
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),['IConversationContextStore','RedisConversationContextStore','IConversationContextService'])
need(Path('Backend/Platform/tests/TSEAI.ConversationContext.SmokeTests/Program.cs'),['حقیقی حقوقیش','آخرین خبرش','مقایسه کن','منظورم خساپا'])
need(Path('TSEAI.sln'),['TSEAI.ConversationContext.SmokeTests'])
cases=json.loads((r/'tests/conversation-context-cases.json').read_text(encoding='utf-8'))
checks.append(('context-corpus',len(cases)>=6))
version=(r/'VERSION').read_text().strip() if (r/'VERSION').exists() else ''
checks.append(('version-rc17+',version.startswith('1.0.0-rc.') and int(version.rsplit('.',1)[1])>=17))
failed=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL'),n)
if failed: sys.exit(1)
print('Sprint 28 validator PASS')
