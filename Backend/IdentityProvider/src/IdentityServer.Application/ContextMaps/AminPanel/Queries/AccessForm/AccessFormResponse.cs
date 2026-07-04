using AutoMapper;
using IdentityServer.Application.Common.Mappings;
using IdentityServer.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm
{
    public class AccessFormResponse : IMapFrom<IdentityServer.Domain.Entities.AccessForm>
    {
        public int AccessFormId { get; set; }
        public string FormTitle { get; set; }
        public string URL { get; set; }
    }
}
