from pathlib import Path
import json,re,sys,yaml
r=Path(__file__).resolve().parents[1]
required=['docker-compose.production.yml','.env.production.example','docs/SPRINT12.md','docs/PRODUCTION-RUNBOOK.md','docs/SECURITY-RELEASE-CHECKLIST.md','tests/release-security-cases.json','scripts/release-gate.sh','scripts/RELEASE-GATE.cmd','Backend/Shared/TSEAI.Shared.Application/Production/ProductionConfigurationGuard.cs','Backend/Platform/src/TSEAI.Infrastructure/Persistence/ReleaseMigrationRunner.cs','TSEAI.Sprint12.Manifest.md','VERSION']
missing=[x for x in required if not (r/x).exists()]
if missing: print('missing',missing);sys.exit(1)
cases=json.loads((r/'tests/release-security-cases.json').read_text(encoding='utf-8'))['cases']
checks={
 'files':not missing,'security-cases':len(cases)>=15,
 'prod-no-console-sms':'SMS_ALLOW_CONSOLE_FALLBACK=false' in (r/'.env.production.example').read_text(encoding='utf-8'),
 'mcp-off':'Mcp__Enabled=false' in (r/'.env.production.example').read_text(encoding='utf-8'),
 'migration-ledger':'__TSEAISchemaMigrations' in (r/'Backend/Platform/src/TSEAI.Infrastructure/Persistence/ReleaseMigrationRunner.cs').read_text(encoding='utf-8'),
 'migration-lock':'sp_getapplock' in (r/'Backend/Platform/src/TSEAI.Infrastructure/Persistence/ReleaseMigrationRunner.cs').read_text(encoding='utf-8'),
 'release-dotnet':'dotnet build' in (r/'scripts/release-gate.sh').read_text(encoding='utf-8'),
 'release-docker':'docker compose' in (r/'scripts/production-e2e.sh').read_text(encoding='utf-8'),
 'release-frontend':'npm ci' in (r/'scripts/release-gate.sh').read_text(encoding='utf-8'),
 'placeholder-reject':'RejectPlaceholder' in (r/'Backend/Shared/TSEAI.Shared.Application/Production/ProductionConfigurationGuard.cs').read_text(encoding='utf-8'),
}

prod=yaml.safe_load((r/'docker-compose.production.yml').read_text(encoding='utf-8'))
public={n:s.get('ports') for n,s in prod['services'].items() if s.get('ports')}
images=[s.get('image','') for s in prod['services'].values()]
checks.update({
 'only-gateway-public':set(public)=={'gateway'},
 'redis-auth':'--requirepass' in str(prod['services']['redis'].get('command')),
 'db-init':'db-init' in prod['services'],
 'no-latest-images':not any(i.endswith(':latest') or i.endswith('-latest') for i in images),
 'dotnet-image-pinned':'sdk:9.0.316' in (r/'docker/dotnet-service.Dockerfile').read_text(encoding='utf-8') and 'aspnet:9.0.18' in (r/'docker/dotnet-service.Dockerfile').read_text(encoding='utf-8'),
 'frontend-top-level-pinned':'^' not in (r/'Frontend/package.json').read_text(encoding='utf-8'),
})

for k,v in checks.items():print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
