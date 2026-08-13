from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]
checks=[]
def need(p,*xs):
 t=(r/p).read_text(encoding="utf-8",errors="ignore") if (r/p).exists() else "";checks.append((p,all(x in t for x in xs)))
need("Backend/Platform/src/TSEAI.Application/Admin/SemanticRegistry.cs","ISemanticRegistryService","SemanticAlias:","SemanticPolicy:","tools.Describe()","__disabled__")
need("Backend/Platform/src/TSEAI.Api/Program.cs","/api/admin/semantic-registry","Operations.Read","SemanticAliasRequest")
need("Frontend/src/AdminOperations.jsx","Semantic Registry","registry.tools","registry.aliases","registry.contentRoutes")
need("Frontend/src/App.jsx","AdminOperations","مرکز مدیریت AI")
checks.append(("version",(r/"VERSION").read_text().strip()>="1.0.0-rc.23"))
for n,o in checks:print("PASS" if o else "FAIL",n)
if not all(o for _,o in checks):sys.exit(1)
print("Sprint 34 validator PASS")
