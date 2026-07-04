using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Healan.Domain.Menus.Entities;
using Healan.Domain.Menus.Enums;

namespace Healan.Infrastructure.Menus.Configs
{
    public class MenuConfiguration : IEntityTypeConfiguration<Menu>
    {
        public void Configure(EntityTypeBuilder<Menu> builder)
        {
            builder.ToTable("Menu");
            builder.HasKey(a => a.MenuId);
            builder.Property(a => a.MenuId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired().ValueGeneratedOnAdd();
            builder.Property(a => a.MenuTitle).HasColumnType("nvarchar(200)").IsRequired();
            builder.Property(a => a.HealanTypeId).HasConversion<byte>().IsRequired().HasDefaultValue(HealanTypeId.HealanAcceptance);

            builder.HasMany(a => a.Submenus).WithOne(b => b.Menu).HasForeignKey(c => c.MenuId).OnDelete(DeleteBehavior.Restrict);
        }
    }

}
