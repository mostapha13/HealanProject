from pathlib import Path
import json,sys,subprocess
r=Path(__file__).resolve().parents[1];d=json.loads((r/"tests/golden-question-dataset.v1.json").read_text(encoding="utf-8"));checks=[("dataset",len(d["cases"])>=250),("version",(r/"VERSION").read_text().strip()>="1.0.0-rc.24"),("manifest",(r/"TSEAI.Sprint35.Manifest.md").exists()),("lint",(r/"scripts/validate-golden-dataset.py").exists())]
for n,o in checks:print("PASS" if o else "FAIL",n)
if not all(o for _,o in checks):sys.exit(1)
print("Sprint 35 validator PASS")
