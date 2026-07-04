using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers
{
    public class WorkFlowUserResponse : IMapFrom<WorkFlowUser>
    {
        public Guid WorkFlowUserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsConfirmed { get; set; }
        public Guid? BrokerId { get; set; }
        public WorkFlowGroupResponse WorkFlowUserGroup { get; set; }
        public FundResponse Fund { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<WorkFlowUser, WorkFlowUserResponse>().IncludeMembers(item => item.WorkFlowUserGroup);
            //profile.CreateMap<WorkFlowUser, WorkFlowUserResponse>().IncludeMembers(item =>new { item.WorkFlowUserGroup ,item.Fund});
            profile.CreateMap<WorkFlowUserGroup, WorkFlowUserResponse>();
            profile.CreateMap<Fund, WorkFlowUserResponse>();
        }
    }


    public class SimpleWorkFlowUserResponse : IMapFrom<WorkFlowUser>
    {
        public Guid WorkFlowUserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public Guid? FundId { get; set; }
    }
}
