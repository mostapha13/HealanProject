using AutoMapper;
using IdentityServer.Application.Common.Mappings;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessRole
{
    public class AccessRoleFullResponse
    {
        public Guid RoleId { get; set; }
        public List<AccessRoleFullResponseItem> Items { get; set; }
    }
    public class AccessRoleFullResponseItem : IMapFrom<IdentityServer.Domain.Entities.AccessMenu>
    {
        [JsonPropertyName("key")]
        public int AccessMenuId { get; set; }
        public int? AccessFormId { get; set; }
        public string Title { get; set; }
        public int? ParentRef { get; set; }
        public int Order { get; set; }
        public int Level { get; set; }
        public bool HasAccess { get; set; }
        public bool? HasPersianAccess { get; set; }
        public AccessFormResponse AccessForm { get; set; }
        public ICollection<AccessRoleFullResponseItem> Children { get; set; }
    }
}
