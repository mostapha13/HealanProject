from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Filters/Chat/ChatIntegratedFilterService.cs',
 'Backend/Platform/tests/TSEAI.ChatFilter.SmokeTests/TSEAI.ChatFilter.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.ChatFilter.SmokeTests/Program.cs',
 'docs/ADR/0012-chat-integrated-tsetmc-filter-engine.md','docs/SPRINT20.md','docs/SPRINT20-VALIDATION.md',
 'tests/chat-filter-cases.json','TSEAI.Sprint20.Manifest.md']
missing=[x for x in required if not (r/x).exists()]
chatfilter=(r/required[0]).read_text(encoding='utf-8') if not missing else ''
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
conv=(r/'Backend/Platform/src/TSEAI.Application/Filters/Conversation/ConversationFilterService.cs').read_text(encoding='utf-8')
execs=(r/'Backend/Platform/src/TSEAI.Application/Filters/Execution/FilterExecutionService.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
sln=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/chat-filter-cases.json').read_text(encoding='utf-8'))['cases'] if not missing else []
checks={
 'files':not missing,
 'detector':all(x in chatfilter for x in ['DeterministicChatFilterIntentDetector','FieldToken','ExplicitFilterTerms','IsDirectDsl']),
 'dsl-extraction':'ExtractDsl' in chatfilter and '```javascript' in chatfilter,
 'history-fail-closed':'RequiresHistory' in chatfilter and 'MarketDailyHistory' in chatfilter,
 'conversation-state':'ImportDslAsync' in conv and 'AppendRevision' in conv and 'CanonicalTsetmcCode' in conv,
 'chat-boundary':(('chatFilters.Detect' in chat) or ('routeDecision.Route==ChatCapabilityRoute.FilterConversation' in chat)) and 'filter.chat' in chat and 'ComposeChatFilter' in chat,
 'quality-gate':'EvaluateMarketSnapshot' in execs and 'CanUseForAnswer' in execs,
 'policy':'"filter.chat"' in policy,
 'di':'IChatFilterIntentDetector, DeterministicChatFilterIntentDetector' in di and 'ChatIntegratedFilterService' in di,
 'no-sql':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\(|SELECT\s+.+FROM)\b',chatfilter,re.I|re.S),
 'api':bool(re.search(r'sprint\s*=\s*(?:2[0-9]|[3-9][0-9])',api)),
 'version':bool(re.fullmatch(r'1\.0\.0-rc\.(?:9|[1-9][0-9]+)',(r/'VERSION').read_text().strip())),
 'solution':'TSEAI.ChatFilter.SmokeTests' in sln,
 'cases':len(cases)>=10 and any(x.get('history') for x in cases) and any(not x.get('filter') for x in cases),
}
for k,v in checks.items():print(k,'OK' if v else 'FAIL')
if missing:print('missing:',*missing,sep='\n - ')
sys.exit(0 if all(checks.values()) else 1)
