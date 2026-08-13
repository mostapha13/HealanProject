from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(p,*xs):
 t=(r/p).read_text(encoding="utf-8",errors="ignore") if (r/p).exists() else ""; checks.append((p,all(x in t for x in xs)))
need("Frontend/src/App.jsx","RichChatMessage","MarketCard","ComparisonCard","StructuredResultCard","EvidenceTray","answerValidation?.status")
need("Frontend/src/styles.css","Sprint 33 — Rich Chat UI","comparison-card","evidence-tray","@media(max-width:760px)")
checks.append(("version",(r/"VERSION").read_text().strip()>="1.0.0-rc.22"))
for n,o in checks: print("PASS" if o else "FAIL",n)
if not all(o for _,o in checks):sys.exit(1)
print("Sprint 33 validator PASS")
