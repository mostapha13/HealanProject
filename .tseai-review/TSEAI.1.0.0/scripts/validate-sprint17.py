from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Tools/StructuredToolContracts.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Tools/SecureStructuredToolGateway.cs',
 'docs/ADR/0009-secure-structured-tool-boundary.md','docs/SPRINT17.md','docs/SPRINT17-VALIDATION.md',
 'tests/structured-tool-cases.json','TSEAI.Sprint17.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
if missing: print('missing',missing);sys.exit(1)
contracts=(r/required[0]).read_text(encoding='utf-8')
gateway=(r/required[1]).read_text(encoding='utf-8')
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
cases=json.loads((r/'tests/structured-tool-cases.json').read_text(encoding='utf-8'))['cases']
checks={
 'files':not missing,
 'registry':all(x in contracts for x in ['market.get_symbol_snapshot','market.get_order_book','market.get_client_type','market.get_summary','market.get_indexes','market.get_instrument']),
 'typed':'record StructuredToolCall' in contracts and 'record StructuredToolResult' in contracts and 'interface IStructuredToolGateway' in contracts,
 'allowlist':'StructuredToolNames.Allowed.Contains' in gateway,
 'entity-gate':'IPersianEntityResolver' in gateway and 'EntityResolutionStatus.Ambiguous' in gateway,
 'quality-gate':'EvaluateMarketSnapshot' in gateway and 'CanUseForAnswer' in gateway and 'market_data_quality_rejected' in gateway,
 'no-dml':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\()\b',gateway,re.I),
 'no-http':'HttpClient' not in gateway and 'IMcpToolGateway' not in gateway,
 'di':'IStructuredToolGateway, SecureStructuredToolGateway' in di,
 'chat':'structuredTools.ExecuteAsync' in chat and 'StructuredToolNames.GetSymbolSnapshot' in chat,
 'policy':'"structured.market.symbol"' in policy,
 'api':'/api/admin/structured-tools' in api and 'RequireClaim("permission", "Operations.Read")' in api,
 'sprint17':bool(re.search(r'sprint\s*=\s*(?:1[7-9]|[2-9]\d+)',api)),
 'version':((lambda v: v.startswith('1.0.0-rc.') and v.rsplit('.',1)[-1].isdigit() and int(v.rsplit('.',1)[-1])>=6)((r/'VERSION').read_text().strip())),
 'cases':len(cases)>=10 and any(x['tool']=='sql.execute' and x['expected']=='rejected' for x in cases),
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
