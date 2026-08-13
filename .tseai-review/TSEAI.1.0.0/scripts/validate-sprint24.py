from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def need(path,text):
    p=root/path
    if not p.exists(): errors.append(f"missing {path}"); return
    s=p.read_text(encoding="utf-8")
    if text not in s: errors.append(f"{path}: missing {text}")
version=(root/'VERSION').read_text(encoding='utf-8').strip()
m=re.fullmatch(r'1\.0\.0-rc\.(\d+)',version)
if not m or int(m.group(1))<13: errors.append(f'expected rc.13 or higher, got {version}')
need(Path('Backend/Knowledge/src/TSEAI.Knowledge.Worker/SqlKnowledgeSourceReader.cs'),'ReadBatchesAsync')
need(Path('Backend/Knowledge/src/TSEAI.Knowledge.Worker/SqlKnowledgeSourceReader.cs'),'ApplicationIntent.ReadOnly')
need(Path('Backend/Knowledge/src/TSEAI.Knowledge.Worker/Phase1KnowledgeSourceDiscovery.cs'),'EDeliveryObject')
need(Path('Backend/Knowledge/src/TSEAI.Knowledge.Worker/Phase1KnowledgeSourceDiscovery.cs'),'@Since')
need(Path('Backend/Knowledge/src/TSEAI.Knowledge.Worker/KnowledgeEntityEnricher.cs'),'LVal18AFC')
need(Path('AI/tseai-ai/app/knowledge/html_sanitizer.py'),'_SKIP_TAGS')
need(Path('AI/tseai-ai/app/knowledge/content_policy.py'),'unknown-content-type-fail-closed')
need(Path('AI/tseai-ai/app/knowledge/preprocessing.py'),'content_hash')
need(Path('AI/tseai-ai/app/knowledge/preprocessing.py'),'page_link_only')
need(Path('AI/tseai-ai/app/knowledge/qdrant_store.py'),'get_document_hashes')
need(Path('AI/tseai-ai/app/knowledge/service.py'),'unchanged')
need(Path('docs/knowledge-ingestion-contract-v2.md'),'Structured market/financial facts remain SQL/Redis Tool facts')
try:
    cases=json.loads((root/'tests/knowledge-ingestion-cases.json').read_text(encoding='utf-8'))
    if len(cases)<12: errors.append('knowledge ingestion corpus too small')
except Exception as ex: errors.append(f'bad knowledge ingestion corpus: {ex}')
if errors:
    print('\n'.join('FAIL: '+e for e in errors));sys.exit(1)
print('Sprint 24 validator PASS')
