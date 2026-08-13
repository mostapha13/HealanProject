from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def need(path,text):
    p=root/path
    if not p.exists(): errors.append(f"missing {path}"); return
    s=p.read_text(encoding='utf-8')
    if text not in s: errors.append(f"{path}: missing {text}")
version=(root/'VERSION').read_text(encoding='utf-8').strip()
m=re.fullmatch(r'1\.0\.0-rc\.(\d+)',version)
if not m or int(m.group(1))<12: errors.append(f'expected rc.12 or higher, got {version}')
need(Path('Backend/Platform/src/TSEAI.Application/Filters/ChatAssets/ChatFilterAssetService.cs'),'ChatFilterAssetOperation')
need(Path('Backend/Platform/src/TSEAI.Application/Filters/ChatAssets/ChatFilterAssetService.cs'),'Filter.Save')
need(Path('Backend/Platform/src/TSEAI.Application/Filters/ChatAssets/ChatFilterAssetService.cs'),'Alert.Create')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),'filter.assets')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs'),'filter.assets')
need(Path('Backend/Platform/src/TSEAI.Api/Program.cs'),'IsChatAssetResult')
need(Path('Backend/Platform/src/TSEAI.Api/Program.cs'),'ChatFilterAssetAuthorization')
need(Path('Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs'),'ChatFilterAssetService')
need(Path('Backend/Platform/tests/TSEAI.ChatFilterAssets.SmokeTests/Program.cs'),'must not over-capture knowledge')
p=root/'tests/chat-filter-assets-cases.json'
try:
    cases=json.loads(p.read_text(encoding='utf-8'))
    if len(cases)<10: errors.append('chat-filter-assets corpus too small')
except Exception as ex: errors.append(f'bad corpus: {ex}')
if errors:
    print('\n'.join('FAIL: '+e for e in errors));sys.exit(1)
print('Sprint 23 validator PASS')
