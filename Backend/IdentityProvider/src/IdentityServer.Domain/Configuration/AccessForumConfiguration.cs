using IdentityServer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Configuration
{
    public class AccessForumConfiguration : IEntityTypeConfiguration<AccessForm>
    {
        public void Configure(EntityTypeBuilder<AccessForm> builder)
        {
            builder.ToTable("AccessForm");
            builder.HasKey(a => a.AccessFormId);
            builder.Property(a => a.AccessFormId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.FormTitle).IsRequired().HasMaxLength(150);
            builder.Property(a => a.URL).HasMaxLength(500);

            builder.HasOne(a => a.AccessSystem).WithMany(b=>b.AccessForms).HasForeignKey(b=>b.AccessSystemId).OnDelete(DeleteBehavior.Restrict);

        }
    }
}
