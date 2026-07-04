using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetForms
{
    public class FundOrderResponse:IMapFrom<Order> 
    {
        public FundResponse Fund { get; set; }
        public decimal BringCash { get; set; }
        public decimal BringShare { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    public void Mapping(Profile profile)
    {
        profile.CreateMap<Order, FundOrderResponse>();
        profile.CreateMap<Order, FundResponse>();
      
    }
    }
}
