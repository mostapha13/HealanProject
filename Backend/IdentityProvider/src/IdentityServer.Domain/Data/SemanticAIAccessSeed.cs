using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IdentityServer.Domain.Data;

public static class SemanticAIAccessSeed
{
    public const int SystemId = 16;
    private const int FormBase = 16000;
    private const int MenuBase = 16100;

    private static readonly string[] Permissions =
    [
        "platform.read", "organizations.read", "organizations.manage", "members.read", "members.manage",
        "integrations.read", "artifacts.read", "artifacts.write", "workflows.read", "connections.read",
        "connections.manage", "connections.test", "connections.credentials.manage", "metadata.read", "metadata.manage",
        "semantic-model.read", "semantic-model.manage", "semantic-model.publish", "knowledge.read", "knowledge.manage",
        "knowledge.search", "agent.read", "agent.use", "agent.manage", "query.read", "query.execute", "query.review",
        "query.technical.read", "query.manage", "dashboard.read", "dashboard.manage", "dashboard.publish", "powerbi.read",
        "powerbi.manage", "powerbi.publish", "powerbi.agent", "forms.read", "forms.manage", "governance.read",
        "governance.manage", "governance.approve", "operations.read", "operations.manage", "operations.backup.manage", "audit.read"
    ];

    private static readonly IReadOnlyDictionary<string, string[]> RolePermissions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["SemanticAIOrganizationAdmin"] = Permissions,
            ["SemanticAIMultiTenant"] = ["platform.read", "organizations.read"],
            ["SemanticAIViewer"] = ReadOnly(),
            ["SemanticAIAnalyst"] = ReadOnly().Concat(["query.execute", "query.review", "agent.use", "connections.test"]).Distinct().ToArray(),
            ["SemanticAIModeler"] = ReadOnly().Concat(["connections.manage", "connections.test", "connections.credentials.manage", "metadata.manage", "semantic-model.manage", "knowledge.manage", "agent.manage", "query.execute", "query.review", "query.technical.read", "query.manage", "dashboard.manage", "powerbi.manage", "forms.manage"]).Distinct().ToArray(),
            ["SemanticAIPublisher"] = ReadOnly().Concat(["semantic-model.publish", "query.execute", "query.review", "dashboard.manage", "dashboard.publish", "powerbi.manage", "powerbi.publish", "governance.approve", "artifacts.write"]).Distinct().ToArray(),
            ["SemanticAIAgent"] = ["platform.read", "knowledge.read", "knowledge.search", "agent.read", "agent.use", "query.read", "query.execute", "artifacts.read", "artifacts.write", "dashboard.read", "dashboard.manage"],
            ["SemanticAIPowerBiAgent"] = ["powerbi.agent"],
            ["SemanticAIService"] = ["platform.read", "integrations.read", "artifacts.read", "artifacts.write", "workflows.read", "knowledge.read", "knowledge.manage", "knowledge.search", "agent.read", "agent.use", "agent.manage", "connections.read", "connections.test", "query.read", "query.execute", "query.manage", "powerbi.agent", "forms.read", "forms.manage", "operations.read"]
        };

    public static async Task SeedAsync(ApplicationDbContext db, RoleManager<ApplicationRole> roleManager)
    {
        var collision = await db.AccessSystems.FirstOrDefaultAsync(x => x.AccessSystemId == SystemId);
        if (collision is not null && !string.Equals(collision.SystemName, "PBAI-Identity", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"AccessSystemId {SystemId} is already used by {collision.SystemName}.");

        if (collision is null)
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                SET IDENTITY_INSERT [AccessSystem] ON;
                INSERT INTO [AccessSystem] ([AccessSystemId], [SystemName], [SystemTitle])
                VALUES ({SystemId}, {"PBAI-Identity"}, {"پلتفرم هوشمندی معنایی سازمانی PBAI"});
                SET IDENTITY_INSERT [AccessSystem] OFF;
                """);
        }

        var existingForms = await db.AccessForms.Where(x => x.AccessSystemId == SystemId).ToListAsync();
        var existingMenus = await db.AccessMenus.Where(x => x.AccessMenuId > MenuBase && x.AccessMenuId <= MenuBase + Permissions.Length).ToListAsync();
        for (var index = 0; index < Permissions.Length; index++)
        {
            var formId = FormBase + index + 1;
            var menuId = MenuBase + index + 1;
            var permission = Permissions[index];
            int? parentId = null;
            var form = existingForms.FirstOrDefault(x => x.AccessFormId == formId);
            if (form is null)
            {
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessForm] ON;
                    INSERT INTO [AccessForm] ([AccessFormId], [AccessSystemId], [FormTitle], [URL])
                    VALUES ({formId}, {SystemId}, {permission}, {$"/permissions/{permission}"});
                    SET IDENTITY_INSERT [AccessForm] OFF;
                    """);
            }
            else { form.FormTitle = permission; form.URL = $"/permissions/{permission}"; }

            var menu = existingMenus.FirstOrDefault(x => x.AccessMenuId == menuId);
            if (menu is null)
            {
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessMenu] ON;
                    INSERT INTO [AccessMenu] ([AccessMenuId], [AccessFormId], [ParentRef], [Order], [Title], [IsActive])
                    VALUES ({menuId}, {formId}, {parentId}, {index + 1}, {permission}, {true});
                    SET IDENTITY_INSERT [AccessMenu] OFF;
                    """);
            }
            else { menu.AccessFormId = formId; menu.Order = index + 1; menu.Title = permission; menu.IsActive = true; }
        }
        await db.SaveChangesAsync();

        foreach (var pair in RolePermissions)
        {
            var role = await EnsureRole(roleManager, pair.Key);
            await Grant(db, role, pair.Value);
        }
        var semanticAdmin = await EnsureRole(roleManager, "SemanticAIAdmin");
        await Grant(db, semanticAdmin, Permissions);
        var globalAdmin = await roleManager.FindByNameAsync(ConstUserInfo.AdminRole);
        if (globalAdmin is not null) await Grant(db, globalAdmin, Permissions);
    }

    private static string[] ReadOnly() =>
    ["platform.read", "organizations.read", "artifacts.read", "connections.read", "metadata.read", "semantic-model.read", "knowledge.read", "knowledge.search", "agent.read", "agent.use", "query.read", "dashboard.read", "powerbi.read", "forms.read", "governance.read", "operations.read"];

    private static async Task<ApplicationRole> EnsureRole(RoleManager<ApplicationRole> manager, string name)
    {
        var role = await manager.FindByNameAsync(name);
        if (role is null)
        {
            role = new ApplicationRole(name) { DisplayName = name, IsSystem = true, CreatedUtc = DateTime.UtcNow };
            var created = await manager.CreateAsync(role);
            if (!created.Succeeded) throw new InvalidOperationException($"Cannot create {name}: {string.Join(", ", created.Errors.Select(x => x.Description))}");
        }
        else
        {
            role.DisplayName = name; role.IsSystem = true; role.IsDeleted = false;
            var updated = await manager.UpdateAsync(role);
            if (!updated.Succeeded) throw new InvalidOperationException($"Cannot update {name}: {string.Join(", ", updated.Errors.Select(x => x.Description))}");
        }
        return role;
    }

    private static async Task Grant(ApplicationDbContext db, ApplicationRole role, IEnumerable<string> permissions)
    {
        if (!await db.AccessSystemRoles.AnyAsync(x => x.RoleId == role.Id && x.AccessSystemId == SystemId))
            db.AccessSystemRoles.Add(new AccessSystemRole { RoleId = role.Id, AccessSystemId = SystemId });
        var expected = permissions.Select(permission => MenuBase + Array.IndexOf(Permissions, permission) + 1).Where(id => id > MenuBase).ToHashSet();
        var existing = await db.AccessRoles.Where(x => x.RoleId == role.Id && x.AccessMenuId > MenuBase && x.AccessMenuId <= MenuBase + Permissions.Length).ToListAsync();
        db.AccessRoles.RemoveRange(existing.Where(x => !expected.Contains(x.AccessMenuId)));
        foreach (var menuId in expected.Except(existing.Select(x => x.AccessMenuId)))
            db.AccessRoles.Add(new AccessRole { RoleId = role.Id, AccessMenuId = menuId, HasPersianAccess = true });
        await db.SaveChangesAsync();
    }
}
