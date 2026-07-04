using FileManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Domain.Services
{
    public interface IApplicationDbContext: IDisposable
    {
        DbSet<FileType> FileTypes { get; set; }
        DbSet<FileManager.Domain.Entities.File> Files { get; set; }
        DbSet<PdfSignature> PdfSignatures { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
    }
}
