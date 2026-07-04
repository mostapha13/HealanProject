using AutoMapper;
using IdentityServer.Application.Common.Mappings;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu
{
    public class AccessMenuFullResponse : IMapFrom<Domain.Entities.AccessMenu>
    {
        public int AccessMenuId { get; set; }
        public int? AccessFormId { get; set; }
        public int? ParentRef { get; set; }
        public int Order { get; set; }
        public int Level { get; set; }
        public AccessFormResponse AccessForm { get; set; }
        public ICollection<AccessMenuFullResponse> Children { get; set; }
    }
}
