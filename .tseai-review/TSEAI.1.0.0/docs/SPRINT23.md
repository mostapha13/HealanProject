# Sprint 23 — Saved Filters & Alerts Through Chat

Status: COMPLETE
Version: `1.0.0-rc.12`

## Scope
- Deterministic Chat commands for save/list/load/delete Saved Filters.
- Deterministic Chat commands for create/list/enable/disable/delete Alerts.
- Uses existing `SavedFilterService`, `AlertRuleService`, SQL persistence, versioning and Alert Worker; no duplicate persistence subsystem.
- Existing ownership, capacity and canonical TSETMC validation remain authoritative.
- Chat enforces the same permissions as REST: `Filter.Save` and `Alert.Create`.
- Creating an alert from an unsaved current filter requires both permissions; if permitted, the current filter is persisted first.
- Asset-management Chat commands do not consume daily question quota.
- Anonymous users fail closed with `authentication_required`.
- Name resolution is exact after Persian normalization; ambiguous/missing names fail closed.

## Supported examples
- `همین رو با اسم کم P/E ذخیره کن`
- `فیلترهای ذخیره شده من رو بده`
- `فیلتر کم P/E رو بارگذاری کن`
- `فیلتر ذخیره شده کم P/E رو حذف کن`
- `همین رو هشدار کن`
- `برای فیلتر کم P/E یک هشدار بساز`
- `هشدارهای من رو بده`
- `هشدار کم P/E رو غیرفعال کن`
- `هشدار کم P/E رو فعال کن`
- `هشدار کم P/E رو حذف کن`

## Security invariants
- No anonymous persistent assets.
- No cross-user asset lookup.
- No permission bypass through Chat.
- No arbitrary SQL/tool execution.
- Alerts always reference an owned Saved Filter and the existing Alert engine remains authoritative.
