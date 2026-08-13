from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Chat/Agentic/AgenticContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Chat/HttpAiChatReflector.cs',
 'Backend/Platform/src/TSEAI.Infrastructure/Mcp/HttpMcpToolGateway.cs',
 'AI/tseai-ai/app/chat_reflection.py',
 'docs/ADR/0004-agentic-ai-reflection-tools-mcp.md']
missing=[x for x in required if not (r/x).exists()]
orch=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
mcp=(r/'Backend/Platform/src/TSEAI.Infrastructure/Mcp/HttpMcpToolGateway.cs').read_text(encoding='utf-8')
checks={
 'files':not missing,
 'bounded-reflection':'ShouldReflect' in orch and 'review.Action=="retrieve_more"' in orch,
 'tool-policy':'toolPolicy.Demand' in orch,
 'mcp-disabled-default':'Mcp:Enabled' in mcp,
 'mcp-allowlist':'AllowedTools' in mcp,
 'no-arbitrary-mcp-server':'server.Any' in mcp}
for k,v in checks.items(): print(k, 'OK' if v else 'FAIL')
if not all(checks.values()): sys.exit(1)
print('Agentic AI validation: PASS')
