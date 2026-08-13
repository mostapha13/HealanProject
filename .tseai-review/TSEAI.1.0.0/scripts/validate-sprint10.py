from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Chat/HttpAiChatPlanner.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Chat/HttpKnowledgeRetriever.cs',
 'AI/tseai-ai/app/chat_planner.py','AI/tseai-ai/tests/test_chat_planner.py','docs/SPRINT10.md','TSEAI.Sprint10.Manifest.md']
missing=[x for x in required if not (root/x).exists()]
program=(root/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
di=(root/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
checks={
 'files-present':not missing,
 'chat-endpoint':'ChatOrchestrator chat' in program and '/api/chat/ask' in program,
 'sprint-marker':'sprint = 10' in program,
 'planner-registered':'IAiChatPlanner, HttpAiChatPlanner' in di,
 'rag-registered':('IKnowledgeRetriever, HttpKnowledgeRetriever' in di) or ('IKnowledgeRetriever, CachedKnowledgeRetriever' in di),
 'fail-closed':'ChatIntent.Clarification' in program,
}
for k,v in checks.items(): print(f'{k}: {"OK" if v else "FAIL"}')
if missing: print('missing:',missing)
sys.exit(0 if all(checks.values()) else 1)
