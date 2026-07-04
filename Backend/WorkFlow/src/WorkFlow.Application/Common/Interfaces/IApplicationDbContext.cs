using WorkFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using Healan.Domain.Views;

namespace WorkFlow.Application.Common.Interfaces
{
    public interface IApplicationDbContext: IDisposable
    {
         DbSet<WorkFlowUser> WorkFlowUsers { get; set; }
         DbSet<WorkFlowUserGroup> WorkFlowUserGroups { get; set; }
     
         DbSet<OrderStatus> OrderStatues { get; set; }

         DbSet<Order> Orders { get; set; }
         DbSet<Fund> Funds { get; set; }


         DbSet<Form> Forms { get; set; }
         DbSet<WorkFlowItem> WorkFlowItems { get; set; }
         DbSet<WorkFlowArchive> WorkFlowArchives { get; set; }
         DbSet<WorkFlowGuide> WorkFlowGuides { get; set; }
         DbSet<WorkFlowType> WorkFlowTypes { get; set; }
         DbSet<WorkFlowStatusGuide> WorkFlowStatusGuides { get; set; }
         DbSet<OrderComment> OrderComments { get; set; }
         //DbSet<UserCardboardRecordView> UserCardboardRecordViews { get; set; }
         //DbSet<UserCardboardRecordView_history> UserCardboardRecordView_histories { get; set; }


        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
    }
}
