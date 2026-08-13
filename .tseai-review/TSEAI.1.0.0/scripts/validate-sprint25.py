from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]; errors=[]
def need(path,text):
 p=root/path
 if not p.exists(): errors.append(f"missing {path}"); return
 if text not in p.read_text(encoding='utf-8'): errors.append(f"{path}: missing {text}")
version=(root/'VERSION').read_text().strip(); m=re.fullmatch(r'1\.0\.0-rc\.(\d+)',version)
if not m or int(m.group(1))<14: errors.append(f'expected rc.14 or higher, got {version}')
need(Path('AI/tseai-ai/app/knowledge/service.py'),'bm25_score')
need(Path('AI/tseai-ai/app/knowledge/service.py'),'freshness_score')
need(Path('AI/tseai-ai/app/knowledge/service.py'),'latest_first')
need(Path('AI/tseai-ai/app/knowledge/qdrant_store.py'),'metadata.topics')
need(Path('AI/tseai-ai/app/knowledge/qdrant_store.py'),'published_at')
need(Path('Backend/Platform/src/TSEAI.Infrastructure/Chat/HttpKnowledgeRetriever.cs'),'TryGetProperty("items"')
need(Path('Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs'),'BuildKnowledgeContext')
try:
 cases=json.loads((root/'tests/advanced-retrieval-cases.json').read_text(encoding='utf-8'))
 if len(cases)<10: errors.append('advanced retrieval corpus too small')
except Exception as ex: errors.append(f'bad corpus: {ex}')
if errors:
 print('\n'.join('FAIL: '+x for x in errors)); sys.exit(1)
print('Sprint 25 validator PASS')
