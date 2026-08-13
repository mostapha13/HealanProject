from pathlib import Path
import json, sys
root=Path(__file__).resolve().parents[1]
required=[
 'AI/tseai-ai/app/knowledge/models.py','AI/tseai-ai/app/knowledge/normalization.py','AI/tseai-ai/app/knowledge/chunking.py',
 'AI/tseai-ai/app/knowledge/embedding.py','AI/tseai-ai/app/knowledge/qdrant_store.py','AI/tseai-ai/app/knowledge/service.py',
 'Backend/Knowledge/src/TSEAI.Knowledge.Worker/TSEAI.Knowledge.Worker.csproj',
 'Backend/Knowledge/src/TSEAI.Knowledge.Worker/SqlKnowledgeSourceReader.cs',
 'Backend/Knowledge/src/TSEAI.Knowledge.Worker/KnowledgeSyncWorker.cs','docs/SPRINT9.md','docs/knowledge-source-contract.md',
 'tests/knowledge-rag-cases.json']
missing=[x for x in required if not (root/x).exists()]
if missing:
 print('MISSING:',*missing,sep='\n- ');sys.exit(1)
main=(root/'AI/tseai-ai/app/main.py').read_text(encoding='utf-8')
for token in ['/knowledge/index','/knowledge/retrieve']:
 if token not in main: print('Missing AI API token',token);sys.exit(1)
if '"sprint": 41' not in main:
 print('Missing current AI sprint marker');sys.exit(1)
compose=(root/'docker-compose.yml').read_text(encoding='utf-8')
for token in ['knowledge-worker:','QDRANT_KNOWLEDGE_COLLECTION','EMBEDDING_BASE_URL']:
 if token not in compose: print('Missing compose token',token);sys.exit(1)
worker=(root/'Backend/Knowledge/src/TSEAI.Knowledge.Worker/SqlKnowledgeSourceReader.cs').read_text(encoding='utf-8')
for token in ['StartsWith("select"','Contains(\';\')','SourceId','Title','Body']:
 if token not in worker: print('Missing SQL safety/contract token',token);sys.exit(1)
cases=json.loads((root/'tests/knowledge-rag-cases.json').read_text(encoding='utf-8'))
if len(cases)<4: print('Insufficient RAG cases');sys.exit(1)
print('Sprint 9 validation OK')
