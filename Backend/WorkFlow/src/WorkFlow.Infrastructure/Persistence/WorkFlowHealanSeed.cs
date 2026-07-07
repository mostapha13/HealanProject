using Microsoft.EntityFrameworkCore;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Infrastructure.Persistence;

/// <summary>
/// گروه‌های WorkFlow مورد نیاز Healan (بیمار، پزشک، کاربر کلینیک).
/// </summary>
public static class WorkFlowHealanSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        var enumItems = EnumExtensions.GetEnumInfo<WorkFlowUserGroupId>();
        var existingIds = await context.WorkFlowUserGroups
            .Select(g => g.WorkFlowUserGroupId)
            .ToListAsync(cancellationToken);

        var added = false;
        foreach (var item in enumItems)
        {
            var groupId = (WorkFlowUserGroupId)item.Key;
            if (existingIds.Contains(groupId))
                continue;

            context.WorkFlowUserGroups.Add(new WorkFlowUserGroup
            {
                WorkFlowUserGroupId = groupId,
                GroupName = item.DisplayName ?? item.Name,
            });
            added = true;
        }

        if (added)
            await context.SaveChangesAsync(cancellationToken);
    }
}
