from pathlib import Path
import json, re, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
required=[
 'docker-compose.yml','docker/dotnet-service.Dockerfile',
 'Backend/Identity/src/TSEAI.Identity.Api/TSEAI.Identity.Api.csproj',
 'Backend/Platform/src/TSEAI.Api/TSEAI.Api.csproj','Frontend/package.json','global.json',
 'Backend/MarketRuntime/src/TSEAI.MarketRuntime.Worker/MarketRuntimeWorker.cs',
 'Backend/Shared/TSEAI.Shared.Application/Market/MarketSymbolSnapshot.cs','docs/MARKET-SQL-MAPPING.md',
 'Backend/Platform/src/TSEAI.Application/Filters/Parsing/TsetmcFilterParser.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Execution/FilterEvaluator.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Conversation/ConversationFilterService.cs',
 'Backend/Platform/src/TSEAI.Domain/Filters/SavedFilter.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Saved/SavedFilterContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Saved/SavedFilterService.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Filters/EfSavedFilterRepository.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Persistence/SavedFilterSchemaInitializer.cs',
 'tests/saved-filter-contract-cases.json','docs/SPRINT7.md','TSEAI.Sprint7.Manifest.md',
 'Backend/Alerts/src/TSEAI.Alert.Worker/TSEAI.Alert.Worker.csproj',
 'Backend/Alerts/src/TSEAI.Alert.Worker/AlertEvaluationWorker.cs',
 'Backend/Notification/src/TSEAI.Notification.Api/Alerts/RabbitMqAlertConsumer.cs',
 'Backend/Platform/src/TSEAI.Domain/Alerts/AlertRule.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Persistence/AlertSchemaInitializer.cs',
 'tests/alert-engine-cases.json','docs/SPRINT8.md','TSEAI.Sprint8.Manifest.md'
]
missing=[p for p in required if not (root/p).exists()]
if missing: raise SystemExit('Missing: '+', '.join(missing))
for p in root.rglob('*.csproj'):
    ET.parse(p)
    source=p.read_text(encoding='utf-8')
    for rel in re.findall(r'<ProjectReference Include="([^"]+)"',source):
        target=(p.parent/rel).resolve()
        if not target.exists(): raise SystemExit(f'Broken ProjectReference: {p} -> {rel}')
for p in ['Frontend/package.json','global.json','tests/tsetmc-conformance-v1.json','tests/conversational-filter-cases.json','tests/saved-filter-contract-cases.json','tests/alert-engine-cases.json']:
    json.loads((root/p).read_text(encoding='utf-8'))
try:
    import yaml
    yaml.safe_load((root/'docker-compose.yml').read_text(encoding='utf-8'))
except ModuleNotFoundError:
    pass
for p in (root/'AI/tseai-ai/app').glob('*.py'):
    compile(p.read_text(encoding='utf-8'),str(p),'exec')
print('TSEAI Sprint 8 cumulative structure validation: OK')
