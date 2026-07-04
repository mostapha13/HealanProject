using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.MedicalFeeServices.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.MedicalFeeServices.Dtos;
public record MedicalFeeServiceInfoResult:IMapFrom<MedicalFeeService>
{
    public long MedicalFeeServiceId { get; set; }
    public long ServiceTypeId { get; set; }
    public string ServiceTypeName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public long Price { get; set; }

    public void Mapping(Profile profile)
    {
        profile.CreateMap<MedicalFeeService, MedicalFeeServiceInfoResult>()
            .ForMember(a => a.ServiceTypeName, b => b.MapFrom(c => c.ServiceType.Title))
           
          ;
    }
}

