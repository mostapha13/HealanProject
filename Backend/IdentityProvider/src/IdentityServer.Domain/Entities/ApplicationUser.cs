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
        public bool IsDeleted { get; set; }
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedUtc { get; set; }
        public Guid? ModifiedBy { get; set; }
        public DateTime? DeletedUtc { get; set; }
        public Guid? DeletedBy { get; set; }

    }
}
