using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Entities
{
    public abstract class AuditableEntity : CreatableEntry
    {
        [ConcurrencyCheck]
        public Guid? LastModifiedBy { get; set; }
        [ConcurrencyCheck]
        public DateTime? LastModifiedAt { get; set; }

        [ConcurrencyCheck]
        public Guid? DeletedBy { get; set; }
        [ConcurrencyCheck]
        public DateTime? DeletedAt { get; set; }
        [DefaultValue(false)]
        public bool IsDeleted { get; set; }
    }
}
