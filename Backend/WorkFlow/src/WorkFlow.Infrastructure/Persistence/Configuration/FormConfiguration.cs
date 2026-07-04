using WorkFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Infrastructure.Persistence.Configuration
{
    public class FormConfiguration : IEntityTypeConfiguration<Form>
    {
        public void Configure(EntityTypeBuilder<Form> builder)
        {
            builder.ToTable("Form");
            builder.HasKey(a => a.FormId);
            builder.Property(a => a.FormId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedNever();
            builder.Property(a => a.FormName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.FormUrl).HasColumnType("nvarchar(200)").IsRequired();
            builder.Property(a => a.ForwardClass).HasColumnType("nvarchar(200)");
            builder.Property(a => a.BackwardClass).HasColumnType("nvarchar(200)");
            builder.Property(a => a.FormStateId);
        }
    }
}
