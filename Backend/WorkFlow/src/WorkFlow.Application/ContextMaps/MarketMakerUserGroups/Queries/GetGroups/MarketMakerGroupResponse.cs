using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups
{
    public class WorkFlowGroupResponse : IMapFrom<WorkFlowUserGroup>
    {
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }
        public string GroupName { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<WorkFlowUserGroup, WorkFlowGroupResponse>();
        }
    }
}
