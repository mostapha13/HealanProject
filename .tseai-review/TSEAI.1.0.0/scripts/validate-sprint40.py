from pathlib import Path
import subprocess,sys,json
r=Path(__file__).resolve().parents[1]; ok=(r/'VERSION').read_text().strip()>='1.0.0-rc.29' and (r/'scripts/ga-readiness.py').exists() and (r/'TSEAI.Sprint40.Manifest.md').exists()
print('PASS' if ok else 'FAIL','Sprint40 artifacts');
if not ok:sys.exit(1)
subprocess.check_call([sys.executable,str(r/'scripts/ga-readiness.py')]);print('Sprint 40 implementation validator PASS')
