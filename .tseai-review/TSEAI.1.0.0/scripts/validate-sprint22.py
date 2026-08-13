from pathlib import Path
import json,sys,re
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Filters/Temporal/FilterTemporalPolicy.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Chat/ChatIntegratedFilterService.cs',
 'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs',
 'Backend/Platform/tests/TSEAI.FilterTemporal.SmokeTests/TSEAI.FilterTemporal.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.FilterTemporal.SmokeTests/Program.cs',
 'docs/ADR/0014-filter-temporal-integration.md','docs/SPRINT22.md','docs/SPRINT22-VALIDATION.md',
 'tests/filter-temporal-cases.json','TSEAI.Sprint22.Manifest.md']
missing=[x for x in required if not (r/x).exists()]
policy=(r/required[0]).read_text(encoding='utf-8') if not missing else ''
chat=(r/required[1]).read_text(encoding='utf-8') if not missing else ''
orch=(r/required[2]).read_text(encoding='utf-8') if not missing else ''
cases=json.loads((r/'tests/filter-temporal-cases.json').read_text(encoding='utf-8')) if not missing else {}
sln=(r/'TSEAI.sln').read_text(encoding='utf-8')
checks={
 'files':not missing,
 'policy':all(x in policy for x in ['CurrentSnapshot','HistoricalUnavailable','FutureUnavailable','MarketDailyHistory','RemoveTemporalExpression']),
 'direct-dsl-guard':'temporalPolicy.Evaluate(temporal)' in chat and 'temporal_guard' in chat and 'preparedQuestion' in chat,
 'orchestration':'chatFilters.ExecuteAsync(subject,request.ConversationId,request.Question,temporalContext' in orch and 'filterTemporalPolicy.Evaluate(temporalContext)' in orch,
 'no-old-bypass':'&& !chatFilterDetection.IsDirectDsl' not in orch,
 'cases':len(cases.get('cases',[]))>=10 and any('دیروز (pl)>(pc)'==x.get('text') for x in cases['cases']),
 'version': bool(re.match(r'^1\.0\.0-rc\.(\d+)$',(r/'VERSION').read_text().strip())) and int(re.match(r'^1\.0\.0-rc\.(\d+)$',(r/'VERSION').read_text().strip()).group(1))>=11,
 'api': bool(re.search(r'sprint = (?:2[2-9]|[3-9][0-9])', (r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8'))),
 'solution':'TSEAI.FilterTemporal.SmokeTests' in sln,
 'no-sql':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\(|SELECT\s+.+FROM)\b',policy,re.I|re.S),
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
if missing: print('missing:',*missing,sep='\n - ')
sys.exit(0 if all(checks.values()) else 1)
