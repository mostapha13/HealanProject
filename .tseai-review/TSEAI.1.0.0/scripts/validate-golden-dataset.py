from pathlib import Path
import json,sys,collections
r=Path(__file__).resolve().parents[1];d=json.loads((r/"tests/golden-question-dataset.v1.json").read_text(encoding="utf-8"));cases=d["cases"];issues=[]
ids=[x.get("id") for x in cases]
if len(ids)!=len(set(ids)):issues.append("duplicate_ids")
for x in cases:
 for k in ("id","category","question","expected"):
  if not x.get(k):issues.append(f"{x.get('id')}:{k}")
 e=x.get("expected",{})
 if "route" not in e or "capabilities" not in e:issues.append(f"{x.get('id')}:expected_contract")
cats=collections.Counter(x["category"] for x in cases)
required={"market","temporal","entity","structured","filter","knowledge","hybrid","conversation","unsupported","security"}
missing=required-set(cats);issues += ["missing_category:"+x for x in sorted(missing)]
if len(cases)<250:issues.append("dataset_too_small")
print("Golden cases",len(cases));print("Categories",dict(sorted(cats.items())))
if issues:
 print("FAIL",issues[:30]);sys.exit(1)
print("Golden dataset structural validation PASS")
