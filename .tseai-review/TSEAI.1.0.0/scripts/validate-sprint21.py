from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Filters/Conversation/ConversationFilterContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Conversation/ConversationFilterService.cs',
 'Backend/Platform/src/TSEAI.Application/Filters/Chat/ChatIntegratedFilterService.cs',
 'AI/tseai-ai/app/conversation_filter_planner.py',
 'Backend/Platform/tests/TSEAI.ConversationalFilter.SmokeTests/TSEAI.ConversationalFilter.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.ConversationalFilter.SmokeTests/Program.cs',
 'docs/ADR/0013-conversational-filter-editing.md','docs/SPRINT21.md','docs/SPRINT21-VALIDATION.md',
 'tests/conversational-filter-cases.json','TSEAI.Sprint21.Manifest.md']
missing=[x for x in required if not (r/x).exists()]
contracts=(r/required[0]).read_text(encoding='utf-8') if not missing else ''
service=(r/required[1]).read_text(encoding='utf-8') if not missing else ''
chat=(r/required[2]).read_text(encoding='utf-8') if not missing else ''
planner=(r/required[3]).read_text(encoding='utf-8') if not missing else ''
sln=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/conversational-filter-cases.json').read_text(encoding='utf-8')) if not missing else []
checks={
 'files':not missing,
 'ops':all(x in contracts for x in ['Explain = "explain"','Execute = "execute"','Undo = "undo"','Redo = "redo"']),
 'state-revisions':'AppendRevision' in service and 'Take(state.Cursor + 1)' in service and 'maxTransientRevisions = 100' in service,
 'validation':'ValidateAndExport' in service and 'compatibility.Import(code)' in service,
 'routing':'ConversationalEditTerms' in chat and 'IsConversationalEdit' in chat and 'conversational-filter-edit' in chat,
 'dsl-edit':'detection.IsDirectDsl && !editRequest' in chat,
 'planner':all(x in planner for x in ['"explain"','"execute"','replace-dsl','"p/e":"pe"']),
 'cases':len(cases)>=13 and any(x.get('operation')=='explain' for x in cases) and any(x.get('operation')=='execute' for x in cases),
 'version': int((r/'VERSION').read_text().strip().rsplit('rc.',1)[1]) >= 10,
 'api': bool(re.search(r'sprint\s*=\s*(?:2[1-9]|[3-9][0-9])', (r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8'))),
 'solution':'TSEAI.ConversationalFilter.SmokeTests' in sln,
 'no-sql':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\(|SELECT\s+.+FROM)\b',chat,re.I|re.S),
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
if missing: print('missing:',*missing,sep='\n - ')
sys.exit(0 if all(checks.values()) else 1)
