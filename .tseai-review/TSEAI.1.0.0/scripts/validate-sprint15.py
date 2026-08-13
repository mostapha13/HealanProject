from pathlib import Path
import json,re,sys

r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Entities/EntityResolutionContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Entities/PersianEntityNormalizer.cs',
 'Backend/Platform/src/TSEAI.Application/Entities/PersianEntityResolver.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Entities/SqlAiEntityCandidateSource.cs',
 'Backend/Platform/tests/TSEAI.EntityResolution.SmokeTests/TSEAI.EntityResolution.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.EntityResolution.SmokeTests/Program.cs',
 'docs/ADR/0007-persian-entity-instrument-resolution.md',
 'docs/SPRINT15.md','docs/SPRINT15-VALIDATION.md',
 'tests/entity-resolution-cases.json','TSEAI.Sprint15.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
if missing:
    print('missing',missing);sys.exit(1)

contracts=(r/required[0]).read_text(encoding='utf-8')
normalizer=(r/required[1]).read_text(encoding='utf-8')
resolver=(r/required[2]).read_text(encoding='utf-8')
source=(r/required[3]).read_text(encoding='utf-8')
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
chat_contracts=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
planner=(r/'AI/tseai-ai/app/chat_planner.py').read_text(encoding='utf-8')
release=(r/'scripts/release-gate.sh').read_text(encoding='utf-8')
release_cmd=(r/'scripts/RELEASE-GATE.cmd').read_text(encoding='utf-8')
solution=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/entity-resolution-cases.json').read_text(encoding='utf-8'))
texts={x['text'] for x in cases['cases']}
mandatory={'خودرو','ایران خودرو','ایرانخودرو','ايران خودرو','وبملت','بانک ملت','شاخص کل','خوزستان','کارگزاری نمونه','موجودیت ناشناخته'}
# replace unit separator placeholder with actual ZWNJ case in the file comparison below
mandatory.remove('ایران\x1fخودرو')
mandatory.add('ایران‌خودرو')

checks={
 'files':not missing,
 'case-count':len(cases['cases'])>=20,
 'mandatory-cases':mandatory.issubset(texts),
 'entity-kinds':all(x in contracts for x in ['Instrument','MarketIndex','Company','TsePerson','RegionHall','FinancialInstitution']),
 'resolver-interface':'interface IPersianEntityResolver' in contracts and 'interface IEntityCandidateSource' in contracts,
 'status-contract':all(x in contracts for x in ['Resolved','Ambiguous','NoMatch','Invalid']),
 'persian-normalization':all(x in normalizer for x in ["'ي' or 'ى' => 'ی'","'ك' => 'ک'","'۰'","'٩'","\\u200c"]),
 'no-llm-in-resolver':all(x not in resolver for x in ['HttpClient','OpenAI','LLM','IAi']),
 'ambiguity-guard':'IsAmbiguous' in resolver and 'AmbiguityDelta' in resolver,
 'exact-id-priority':'ExactIdentifier' in resolver and 'ExactSymbol' in resolver,
 'readonly-sql':'ApplicationIntent = ApplicationIntent.ReadOnly' in source,
 'parameterized-sql':'new CommandDefinition(sql, Params(request)' in source and '@Original' in source and '@Like' in source,
 'no-write-sql':not re.search(r'\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|TRUNCATE)\b',source,re.I),
 'no-request-sql-identifier':not re.search(r'(FROM|JOIN|ORDER BY|SELECT)[^\n]*\{request\.',source,re.I),
 'source-tables':all(x in source for x in ['dbo.Instrument','dbo.IndexLastLive','dbo.Company','dbo.TsePerson','dbo.Talar','dbo.Nahad_Mali']),
 'no-person-contact-metadata':'["email"]' not in source and '["phone"]' not in source,
 'di':'IEntityCandidateSource, SqlAiEntityCandidateSource' in di and 'IPersianEntityResolver, PersianEntityResolver' in di,
 'tool-policy':'"entity.resolve"' in policy,
 'chat-entity':'entities.ResolveAsync' in chat and 'EntityKind.Instrument' in chat and 'EntityKind.MarketIndex' in chat,
 'chat-before-market':(chat.find('entities.ResolveAsync') < min([x for x in [chat.find('market.FindAsync'),chat.find('structuredTools.ExecuteAsync')] if x!=-1]) or ('turnContext.PrimaryEntity' in chat and 'turnContext.SecondaryEntity' in chat and 'conversationContext.PrepareAsync' in chat)),
 'chat-inscode':'Selected.InsCode?.ToString()' in chat,
 'knowledge-does-not-trust-hint':'string? resolvedSymbol=null;' in chat,
 'chat-ambiguity':'EntityResolutionStatus.Ambiguous' in chat and 'EntityResolutionStatus.NoMatch' in chat,
 'chat-index-fail-closed':'capability_unavailable' in chat and 'IndexLastLive' in chat,
 'chat-contract':'EntityResolution? Entity' in chat_contracts,
 'planner-multiword':'_entity_hint' in planner and 'entity-hint-detected' in planner,
 'api-endpoint':'/api/admin/entity/resolve' in api and 'RequireClaim("permission", "Operations.Read")' in api and 'Enum.IsDefined(typeof(EntityKind), kind)' in api,
 'sprint15-root':bool(re.search(r'sprint\s*=\s*(15|16|17)',api)),
 'version':((lambda v: v.startswith('1.0.0-rc.') and v.rsplit('.',1)[-1].isdigit() and int(v.rsplit('.',1)[-1])>=4)((r/'VERSION').read_text().strip())),
 'smoke-in-solution':'TSEAI.EntityResolution.SmokeTests' in solution,
 'release-validator':'validate-sprint15.py' in release and 'validate-sprint15.py' in release_cmd,
 'release-smoke':'run-dotnet-smoke.py' in release and 'run-dotnet-smoke.py' in release_cmd,
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
