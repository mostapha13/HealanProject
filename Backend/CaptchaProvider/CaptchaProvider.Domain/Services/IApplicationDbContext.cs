using CaptchaProvider.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.Services
{
   public interface IApplicationDbContext
    {
        public DbSet<CaptchaInfo> CaptchaInfos { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
