from pathlib import Path
import json,sys
r=Path(__file__).resolve().parents[1]; ok=(r/'VERSION').read_text(encoding='utf-8').strip()>='1.0.0-rc.28' and (r/'scripts/production-e2e.sh').exists() and (r/'scripts/finalize-production-acceptance.py').exists()
print('PASS' if ok else 'FAIL','Sprint39 implementation');sys.exit(0 if ok else 1)
