using AutoMapper;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.Role
{
    public class RoleResponse
    {
        public Guid RoleId { get; set; }
        public string RoleName { get; set; }
        public string RoleTitle { get; set; }
    }
}
