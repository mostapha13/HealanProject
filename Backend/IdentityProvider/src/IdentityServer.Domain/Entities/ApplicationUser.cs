using Microsoft.AspNetCore.Identity;
using Share.Domain.Enums;
using System;

namespace IdentityServer.Domain.Entities
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? ResetPasswordToken { get; set; }
        public DepartmentId DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public string? LastLoginIP { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public DateTime? CodeSendedDateTime { get; set; }

    }
}
