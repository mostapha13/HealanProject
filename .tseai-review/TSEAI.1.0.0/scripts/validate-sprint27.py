from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]; errors=[]
def need(path,text):
 p=root/path
 if not p.exists(): errors.append(f"missing {path}"); return
 if text not in p.read_text(encoding='utf-8'): errors.append(f"{path}: missing {text}")
version=(root/'VERSION').read_text().strip(); m=re.fullmatch(r'1\.0\.0-rc\.(\d+)',version)
if not m or int(m.group(1))<16: errors.append(f'expected rc.16 or higher, got {version}')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Routing/HybridPlanContracts.cs'),'DeterministicMultiToolHybridPlanner')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Routing/HybridPlanContracts.cs'),'MaxParallelism')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),'Task.WhenAll')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),'hybrid.plan')
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),'IMultiToolHybridPlanner')
need(Path('Backend/Platform/tests/TSEAI.MultiToolHybridPlanner.SmokeTests/Program.cs'),'Multi-Tool Hybrid Planner smoke PASS')
try:
 cases=json.loads((root/'tests/multi-tool-hybrid-cases.json').read_text(encoding='utf-8'))
 if len(cases)<6: errors.append('hybrid corpus too small')
except Exception as ex: errors.append(f'bad corpus: {ex}')
router=(root/'Backend/Platform/src/TSEAI.Application/Chat/Routing/DeterministicCapabilityRouter.cs').read_text(encoding='utf-8')
for cap in ['entity.resolve','structured.market.symbol','knowledge.retrieve','analytics.symbol']:
 if cap not in router: errors.append('hybrid registry missing '+cap)
if errors:
 print('\n'.join('FAIL: '+x for x in errors)); sys.exit(1)
print('Sprint 27 validator PASS')
