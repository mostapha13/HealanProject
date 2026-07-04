using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.MedicalFeeServices.Enums;
using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Extensions;

namespace Healan.Application.ServiceTypes.Dtos;
public class ServiceTypeDto : IMapFrom<ServiceType>
{
    public long ServiceTypeId { get; set; }
    public string Title { get; set; }
    public string? Code { get; set; }
    public CategoryTypeId CategoryTypeId { get; set; }
    public string CategoryTypeName { get; set; }
    public string Description { get; set; }

    public void Mapping(Profile profile)
    {
        profile.CreateMap<ServiceType, ServiceTypeDto>()
               .ForMember(a => a.CategoryTypeName, b => b.MapFrom(c => c.CategoryTypeId.GetDisplayName()))
            ;

    }
}

