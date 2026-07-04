using Healan.Application.Common.Mappings;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Companies.Enums;

namespace Healan.Application.Companies.Dtos;
public record CompanyRegistrationTypeInfo : IMapFrom<CompanyRegistrationType>
{
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    public string CompanyRegistrationTypeName { get; set; }
}

