using AutoMapper;
using IdentityServer.Application.Common.Mappings;
using IdentityServer.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessUserRole
{
    public class AccessUserRoleResponse
    {
        //public int AccessMenuId { get; set; }
        //public int AccessFormId { get; set; }
        public int AccessSystemId { get; set; }
        public string FormTitle { get; set; }
        public string URL { get; set; }
        public string PageUrl { get; set; }
        public bool HasAccess { get; set; }
        public bool? HasPersianAccess { get; set; }
    }
}
