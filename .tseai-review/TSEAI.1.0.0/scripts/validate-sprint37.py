from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]; fs=['Backend/Platform/src/TSEAI.Application/Performance/PerformanceContracts.cs','Backend/Platform/src/TSEAI.Infrastructure/Chat/CachedKnowledgeRetriever.cs','scripts/performance-smoke.py','TSEAI.Sprint37.Manifest.md']
ok=(r/'VERSION').read_text().strip()>='1.0.0-rc.26' and all((r/x).exists() for x in fs)
print('PASS' if ok else 'FAIL','Sprint37 artifacts');sys.exit(0 if ok else 1)
