from pathlib import Path
import subprocess,sys,json
r=Path(__file__).resolve().parents[1]; ok=(r/'VERSION').read_text(encoding='utf-8').strip()>='1.0.0-rc.27' and (r/'Backend/Platform/src/TSEAI.Application/Security/AgenticSecurityGuard.cs').exists() and len(json.loads((r/'tests/security-adversarial.v1.json').read_text(encoding='utf-8'))['cases'])>=6
print('PASS' if ok else 'FAIL','Sprint38 artifacts');
if not ok:sys.exit(1)
subprocess.check_call([sys.executable,str(r/'scripts/security-static-audit.py')]);print('Sprint 38 validator PASS')
