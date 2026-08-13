from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/StructuredQuery/StructuredQueryContracts.cs',
 'Backend/Platform/src/TSEAI.Application/StructuredQuery/PersianNaturalLanguageStructuredQueryInterpreter.cs',
 'Backend/Platform/src/TSEAI.Application/StructuredQuery/StructuredQueryService.cs',
 'Backend/Platform/tests/TSEAI.StructuredQuery.SmokeTests/TSEAI.StructuredQuery.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.StructuredQuery.SmokeTests/Program.cs',
 'docs/ADR/0011-natural-language-structured-query.md','docs/SPRINT19.md','docs/SPRINT19-VALIDATION.md',
 'tests/structured-query-cases.json','TSEAI.Sprint19.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
contracts=(r/required[0]).read_text(encoding='utf-8') if not missing else ''
parser=(r/required[1]).read_text(encoding='utf-8') if not missing else ''
service=(r/required[2]).read_text(encoding='utf-8') if not missing else ''
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
sln=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/structured-query-cases.json').read_text(encoding='utf-8'))['cases'] if not missing else []
checks={
 'files':not missing,
 'contracts':all(x in contracts for x in ['StructuredQueryMetric','StructuredQueryOperator','StructuredQueryPlan','StructuredQueryExecutionResult','IStructuredQueryService']),
 'bounded-plan':'p.Take is < 1 or > 200' in service and 'p.Conditions.Count > 12' in service,
 'quality-gate':'EvaluateMarketSnapshot' in service and 'CanUseForAnswer' in service,
 'analytics':'AnalyzeSymbol' in service and 'AnalyticsAvailability.Available' in service,
 'unavailable-not-zero':'if (v is null) return false' in service,
 'single-symbol-guard':'confidence -= 0.12' in parser and 'screeningLanguage' in parser,
 'persian-normalization':all(x in parser for x in ["Replace('ي','ی')","Replace('ك','ک')","NormalizeDigits"]),
 'no-arbitrary-sql':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\(|SELECT\s+.+FROM)\b', service, re.I|re.S),
 'di':'INaturalLanguageStructuredQueryInterpreter, PersianNaturalLanguageStructuredQueryInterpreter' in di and 'IStructuredQueryService, StructuredQueryService' in di,
 'api':'/api/structured-query/execute' in api and bool(re.search(r'sprint\s*=\s*(?:19|[2-9][0-9])',api)),
 'chat':(('structuredQueryInterpreter.Interpret' in chat) or ('routeDecision.Route==ChatCapabilityRoute.StructuredQuery' in chat)) and 'structuredQueryService.ExecuteAsync' in chat and 'ChatIntent.StructuredQuery' in chat,
 'policy':'"structured.query"' in policy,
 'solution':'TSEAI.StructuredQuery.SmokeTests' in sln,
 'version':bool(re.fullmatch(r'1\.0\.0-rc\.(?:8|9|[1-9][0-9]+)',(r/'VERSION').read_text().strip())),
 'cases':len(cases)>=12 and any(x.get('mustNotIntercept') for x in cases),
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
if missing: print('missing:',*missing,sep='\n - ')
sys.exit(0 if all(checks.values()) else 1)
