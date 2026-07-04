using IdentityServer.Domain.DTOs;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.ApplicationPolicy.Services
{
   public interface IUserAccessActionService
    {
        Task UpdateUserAccessSummary();
        Task<ICollection<UserAccessSummary>> GetUserAccessSummary(Guid? roleId, Guid? groupRoleId);

        Task<ICollection<UserAccessSummary>> SetAccess(SetAccessViewModel setAccessViewModel);
    }
}
