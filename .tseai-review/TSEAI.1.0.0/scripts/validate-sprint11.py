from pathlib import Path
import json,sys
r=Path(__file__).resolve().parents[1]
required=[
'docs/SPRINT11.md','tests/admin-operations-cases.json','Frontend/src/AdminOperations.jsx',
'Backend/Platform/src/TSEAI.Domain/Operations/AuditEvent.cs',
'Backend/Platform/src/TSEAI.Domain/Operations/OperationalIncident.cs',
'Backend/Platform/src/TSEAI.Application/Operations/OperationsContracts.cs',
'Backend/Platform/src/TSEAI.Application/Operations/IOperationsStore.cs',
'Backend/Platform/src/TSEAI.Infrastructure/Operations/SqlOperationsStore.cs',
'Backend/Platform/src/TSEAI.Infrastructure/Persistence/OperationsSchemaInitializer.cs']
missing=[x for x in required if not (r/x).exists()]
json.load(open(r/'tests/admin-operations-cases.json',encoding='utf-8'))
if missing: print('FAIL',missing); sys.exit(1)
print('Sprint 11 validation: PASS')
