from pathlib import Path
import json,re,sys

r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/DataQuality/DataQualityContracts.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/DataQuality/DataQualityService.cs',
 'Backend/Platform/tests/TSEAI.DataQuality.SmokeTests/TSEAI.DataQuality.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.DataQuality.SmokeTests/Program.cs',
 'docs/ADR/0008-data-quality-freshness-boundary.md',
 'docs/SPRINT16.md','docs/SPRINT16-VALIDATION.md',
 'tests/data-quality-cases.json','TSEAI.Sprint16.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
if missing:
    print('missing',missing);sys.exit(1)

contracts=(r/required[0]).read_text(encoding='utf-8')
service=(r/required[1]).read_text(encoding='utf-8')
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
chat_contracts=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs').read_text(encoding='utf-8')
filters=(r/'Backend/Platform/src/TSEAI.Application/Filters/Execution/FilterExecutionService.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
compose=(r/'docker-compose.yml').read_text(encoding='utf-8')
release=(r/'scripts/release-gate.sh').read_text(encoding='utf-8')
release_cmd=(r/'scripts/RELEASE-GATE.cmd').read_text(encoding='utf-8')
solution=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/data-quality-cases.json').read_text(encoding='utf-8'))

checks={
 'files':not missing,
 'case-count':len(cases['cases'])>=20,
 'statuses':all(x in contracts for x in ['Valid','Warning','Stale','Invalid','Unknown']),
 'quality-interface':'interface IDataQualityService' in contracts and 'EvaluateMarketSnapshot' in contracts and 'EvaluateCanonicalSourcesAsync' in contracts,
 'deterministic-no-llm':all(x not in service for x in ['HttpClient','OpenAI','LLM','IAi']),
 'freshness-live':'MarketLiveMaxAgeSeconds' in service and 'SnapshotUpdatedAtUtc' in service,
 'tehran-hours':'08:30' in compose and '13:30' in compose and 'DayOfWeek.Thursday' in service and 'DayOfWeek.Friday' in service,
 'source-collected-semantics':'collection timestamp, not an event/business date' in service and 'AsSourceCollectedUtc' in service,
 'quality-rules':all(x in service for x in ['price.min_gt_max','orderbook.duplicate_level','orderbook.crossed','client_type.negative','source.stale']),
 'no-source-repair':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE)\b',service,re.I),
 'di':'IDataQualityService, DataQualityService' in di,
 'tool-policy':'"data-quality.market"' in policy,
 'chat-gate':(('dataQuality.EvaluateMarketSnapshot' in chat and '!qualityReport.CanUseForAnswer' in chat) or ('structuredTools.ExecuteAsync' in chat and 'market_data_quality_rejected' in chat)),
 'chat-quality-before-compose': (chat.find('structuredTools.ExecuteAsync')>=0 and chat.find('var answer=answerComposer.Compose')>=0 and chat.find('structuredTools.ExecuteAsync') < chat.find('var answer=answerComposer.Compose')),
 'chat-contract':'MarketDataQualityReport? DataQuality' in chat_contracts,
 'filter-gate':'dataQuality.EvaluateMarketSnapshot' in filters and 'QualityRejected' in filters and 'qualityRejected++' in filters,
 'api-source':'/api/admin/data-quality' in api and 'EvaluateCanonicalSourcesAsync' in api,
 'api-market':'/market/{key}' in api and 'EvaluateMarketSnapshot' in api,
 'admin-auth':'RequireClaim("permission", "Operations.Read")' in api,
 'sprint16-root':bool(re.search(r'sprint\s*=\s*(?:1[6-9]|[2-9]\d+)',api)),
 'version':((lambda v: v.startswith('1.0.0-rc.') and v.rsplit('.',1)[-1].isdigit() and int(v.rsplit('.',1)[-1])>=5)((r/'VERSION').read_text().strip())),
 'smoke-in-solution':'TSEAI.DataQuality.SmokeTests' in solution,
 'release-validator':'validate-sprint16.py' in release and 'validate-sprint16.py' in release_cmd,
 'release-smoke':'run-dotnet-smoke.py' in release and 'run-dotnet-smoke.py' in release_cmd,
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
