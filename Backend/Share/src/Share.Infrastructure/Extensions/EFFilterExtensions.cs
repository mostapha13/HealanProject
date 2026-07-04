using Microsoft.EntityFrameworkCore;
using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.Extensions;

public static class EFFilterExtensions
{
    public static void SetQueryFilter(this ModelBuilder modelBuilder)
    {
        var models = modelBuilder.Model.GetEntityTypes();

        foreach (var type in models)
        {
            // فقط انواع پایه که از AuditableEntity ارث‌بری دارند و BaseType ندارند
            if (typeof(AuditableEntity).IsAssignableFrom(type.ClrType) && type.BaseType == null)
            {
                modelBuilder.SetSoftDeleteFilter(type.ClrType);
            }
        }
    }

    public static void SetSoftDeleteFilter(this ModelBuilder modelBuilder, Type entityType)
    {
        SetSoftDeleteFilterMethod.MakeGenericMethod(entityType)
            .Invoke(null, new object[] { modelBuilder });
    }

    static readonly MethodInfo SetSoftDeleteFilterMethod = typeof(EFFilterExtensions)
        .GetMethods(BindingFlags.Public | BindingFlags.Static)
        .Single(t => t.IsGenericMethod && t.Name == "SetSoftDeleteFilter");

    public static void SetSoftDeleteFilter<TEntity>(this ModelBuilder modelBuilder)
        where TEntity : AuditableEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(x => x.DeletedAt == null);
    }
}