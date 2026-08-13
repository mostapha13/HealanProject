from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]

def text(path): return (root/path).read_text(encoding='utf-8')

program=text('Backend/Platform/src/TSEAI.Api/Program.cs')
service=text('Backend/Platform/src/TSEAI.Application/Filters/Saved/SavedFilterService.cs')
repo=text('Backend/Platform/src/TSEAI.Infrastructure/Filters/EfSavedFilterRepository.cs')
schema=text('Backend/Platform/src/TSEAI.Infrastructure/Persistence/SavedFilterSchemaInitializer.cs')
settings=text('Backend/Platform/src/TSEAI.Domain/Settings/SystemSetting.cs')
identity=text('Backend/Identity/src/TSEAI.Identity.Domain/IdentityConstants.cs')
ui=text('Frontend/src/App.jsx')
cases=json.loads(text('tests/saved-filter-contract-cases.json'))
assert len(cases) >= 9

required_routes=[
 'MapGroup("/api/saved-filters")',
 'MapPost("/"', 'MapPut("/{id:guid}"', 'MapDelete("/{id:guid}"',
 'MapPost("/{id:guid}/versions"', 'MapGet("/{id:guid}/versions"',
 'MapPost("/{id:guid}/restore/{version:int}"', 'MapPost("/{id:guid}/duplicate"',
 'MapPost("/{id:guid}/load"'
]
for r in required_routes: assert r in program, r
assert 'RequireClaim("permission", "Filter.Save")' in program
assert 'FindFirstValue(ClaimTypes.NameIdentifier)' in program
assert 'FilterSave = "Filter.Save"' in identity
assert 'Filters.MaxSavedFiltersPerUser' in settings
assert 'OwnerUserId == ownerUserId' in repo
assert repo.count('OwnerUserId == ownerUserId') >= 4
assert 'restore' in service and 'nextVersion' in service and 'target.TsetmcCode' in service
assert 'IsDeleted = true' in service
assert 'load_saved' in service
assert 'SavedFilterLimitReachedException' in service
assert 'CREATE UNIQUE INDEX [UX_SavedFilters_Owner_Name_Active]' in schema
assert '[RowVersion] rowversion NOT NULL' in schema
assert 'SavedFilterVersions' in schema
assert 'فیلترهای من' in ui and 'تاریخچه نسخه‌ها' in ui and 'Import و ذخیره' in ui
print('TSEAI Sprint 7 saved-filter invariants: OK')
