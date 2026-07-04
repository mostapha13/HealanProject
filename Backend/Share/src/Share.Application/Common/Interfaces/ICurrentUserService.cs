using Share.Domain.Enums;
using System;

namespace Share.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        Guid UserId { get; }
        DepartmentId DepartmentId { get; }
        string AuthTime { get; }
    }
}
