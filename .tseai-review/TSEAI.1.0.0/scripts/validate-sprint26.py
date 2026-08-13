from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]; errors=[]
def need(path,text):
 p=root/path
 if not p.exists(): errors.append(f"missing {path}"); return
 if text not in p.read_text(encoding='utf-8'): errors.append(f"{path}: missing {text}")
version=(root/'VERSION').read_text().strip(); m=re.fullmatch(r'1\.0\.0-rc\.(\d+)',version)
if not m or int(m.group(1))<15: errors.append(f'expected rc.15 or higher, got {version}')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Routing/CapabilityRouterContracts.cs'),'CapabilityRouteDecision')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Routing/DeterministicCapabilityRouter.cs'),'bounded-ai-planner')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),'capability.route')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs'),'capability.route')
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),'IChatCapabilityRouter')
need(Path('Backend/Platform/tests/TSEAI.CapabilityRouter.SmokeTests/Program.cs'),'Capability Router smoke PASS')
need(Path('TSEAI.sln'),'TSEAI.CapabilityRouter.SmokeTests')
try:
 cases=json.loads((root/'tests/capability-router-cases.json').read_text(encoding='utf-8'))
 if len(cases)<6: errors.append('capability router corpus too small')
 if not any(x.get('route')=='Hybrid' for x in cases): errors.append('hybrid routing case missing')
except Exception as ex: errors.append(f'bad corpus: {ex}')
# Guard against reintroducing direct planner invocation in the orchestrator.
orch=(root/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
if 'planner.PlanAsync' in orch: errors.append('ChatOrchestrator must route through IChatCapabilityRouter, not planner directly')
if errors:
 print('\n'.join('FAIL: '+x for x in errors)); sys.exit(1)
print('Sprint 26 validator PASS')
