using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class Workflow_WorkFlowUser
    {

        public Guid WorkFlowUserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public Guid? FundId { get; set; }
        public Guid? BrokerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsConfirmed { get; set; }
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }

    }
}
