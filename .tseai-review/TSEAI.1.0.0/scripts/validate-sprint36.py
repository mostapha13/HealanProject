from pathlib import Path
import json,subprocess,sys
r=Path(__file__).resolve().parents[1]
checks=[('version',(r/'VERSION').read_text().strip()>='1.0.0-rc.25'),('thresholds',(r/'config/evaluation-thresholds.json').exists()),('runner',(r/'scripts/evaluate-golden-dataset.py').exists()),('manifest',(r/'TSEAI.Sprint36.Manifest.md').exists())]
for n,o in checks: print('PASS' if o else 'FAIL',n)
if not all(o for _,o in checks): sys.exit(1)
subprocess.check_call([sys.executable,str(r/'scripts/evaluate-golden-dataset.py')])
print('Sprint 36 validator PASS')
