using Share.Domain.Enums;
using System;

namespace Share.Domain.Entities
{
    public abstract class CreatableEntry 
    {
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DepartmentId DepartmentId { get; set; }
    }
}
