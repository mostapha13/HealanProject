from pathlib import Path
import json,re,sys,yaml

r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Data/Canonical/CanonicalDataContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Data/Canonical/CanonicalSourceCatalog.cs',
 'Backend/Platform/src/TSEAI.Application/Data/Canonical/CanonicalMoneyNormalizer.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Data/Canonical/SqlAiCanonicalDataGateway.cs',
 'docs/ADR/0005-canonical-sql-ai-boundary.md',
 'docs/SPRINT13.md',
 'docs/data/TSEAI.DataSourceContract.v1.md',
 'docs/data/TSEAI.DataMigrationQueries.v22.md',
 'docs/data/CANONICAL-SOURCE-MAPPING.md',
 'docs/data/PHASE1-SQLAI-BASELINE.md',
 'docs/SPRINT13-VALIDATION.md',
 'docs/ROADMAP-POST-RC.md',
 'tests/canonical-data-cases.json',
 'TSEAI.Sprint13.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
if missing:
    print('missing',missing);sys.exit(1)

contracts=(r/required[0]).read_text(encoding='utf-8')
catalog=(r/required[1]).read_text(encoding='utf-8')
money=(r/required[2]).read_text(encoding='utf-8')
gateway=(r/required[3]).read_text(encoding='utf-8')
gateway_sql_scan=re.sub(r'decimal\.Truncate','',gateway,flags=re.I)
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
infra=(r/'Backend/Platform/src/TSEAI.Infrastructure/TSEAI.Infrastructure.csproj').read_text(encoding='utf-8')
cases=json.loads((r/'tests/canonical-data-cases.json').read_text(encoding='utf-8'))

expected=cases['sources']
checks={
 'files':not missing,
 'source-count':len(expected)==18,
 'source-catalog':all(f'"{x}"' in catalog for x in expected),
 'canonical-interface':'interface ICanonicalDataGateway' in contracts,
 'instrument-string-id':'string InstrumentId' in contracts,
 'money-units':all(x in money or x in contracts for x in cases['moneyUnits']),
 'no-money-heuristic':'Magnitude' not in money and 'Math.Log' not in money,
 'read-only-intent':'ApplicationIntent = ApplicationIntent.ReadOnly' in gateway,
 'parameterized-instrument':'@InstrumentId' in gateway and '@Key' in gateway,
 'safe-source-identifier':'Unsafe static source identifier' in gateway,
 'no-write-sql':not re.search(r'\b(INSERT|UPDATE|DELETE|MERGE|TRUNCATE)\b',gateway_sql_scan,re.I),
 'di':'ICanonicalDataGateway, SqlAiCanonicalDataGateway' in di,
 'dapper':'Dapper' in infra,
 'sqlclient':'Microsoft.Data.SqlClient' in infra,
 'admin-status':'/api/admin/canonical' in api and 'Operations.Read' in api,
 'sprint13-root':bool(re.search(r'sprint\s*=\s*(?:1[3-9]|[2-9]\d)',api)),
 'version':bool(re.fullmatch(r'1\.0\.0-rc\.(?:[2-9]|[1-9]\d+)',(r/'VERSION').read_text().strip())),
 'migration-doc':'OrderBookCurrent' in (r/'docs/data/TSEAI.DataMigrationQueries.v22.md').read_text(encoding='utf-8'),
}

compose=yaml.safe_load((r/'docker-compose.yml').read_text(encoding='utf-8'))
prod=yaml.safe_load((r/'docker-compose.production.yml').read_text(encoding='utf-8'))
for label,obj in [('compose',compose),('prod-compose',prod)]:
    env=obj['services']['tseai-api'].get('environment',{})
    checks[f'{label}-sqlai']='ConnectionStrings__SqlAi' in env
    checks[f'{label}-money-unit']='SqlAi__CashMarketMoneyUnit' in env

for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
