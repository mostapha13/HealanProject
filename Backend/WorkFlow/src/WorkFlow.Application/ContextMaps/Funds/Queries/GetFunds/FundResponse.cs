using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds
{
    public class FundResponse : IMapFrom<Fund>
    {
        public Guid FundId { get; set; }
        public string FundName { get; set; }

    }
}
