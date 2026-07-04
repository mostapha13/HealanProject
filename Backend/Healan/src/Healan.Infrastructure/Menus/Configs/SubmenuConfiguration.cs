using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Healan.Domain.Menus.Entities;
using Newtonsoft.Json;


namespace Healan.Infrastructure.Menus.Configs
{
    public class SubmenuConfiguration : IEntityTypeConfiguration<Submenu>
    {
        public void Configure(EntityTypeBuilder<Submenu> builder)
        {
            builder.ToTable("Submenu");
            builder.HasKey(a => a.SubmenuId);
            builder.Property(a => a.SubmenuId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired().ValueGeneratedOnAdd();
            builder.Property(a => a.SubmenuTitle).HasColumnType("nvarchar(200)").IsRequired();
            builder.Property(a => a.ComponentName).HasColumnType("nvarchar(350)").IsRequired();
            builder.Property(a => a.SaveApiName).HasColumnType("nvarchar(350)").IsRequired();
            builder.Property(a => a.FindApiName).HasColumnType("nvarchar(350)").IsRequired();
            builder.Property(a => a.ConfirmApiName).HasColumnType("nvarchar(350)").IsRequired();
            builder.Property(a => a.RejectApiName).HasColumnType("nvarchar(350)").IsRequired();
            builder.Property(a => a.ListApiName).HasColumnType("nvarchar(350)").HasDefaultValue(null);
            builder.Property(a => a.SignatureSaveApiName).HasColumnType("nvarchar(350)").HasDefaultValue(null);
            builder.Property(a => a.Label).HasDefaultValue(null);



            builder.Property(a => a.Label).HasConversion(
                v => JsonConvert.SerializeObject(v),
                v => JsonConvert.DeserializeObject<Dictionary<string, string>>(v)
                );

            builder.HasOne(a => a.Menu).WithMany(b => b.Submenus).HasForeignKey(c => c.MenuId).OnDelete(DeleteBehavior.Restrict);
            //builder.HasMany(a => a.DossierProgresses).WithOne(b => b.DossierSubmenu).HasForeignKey(c => c.DossierSubmenuId).OnDelete(DeleteBehavior.Restrict);
        }

    }


}
