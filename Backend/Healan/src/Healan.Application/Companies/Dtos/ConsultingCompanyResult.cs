using Healan.Application.Common.Mappings;
using Healan.Domain.Companies.Entities;

namespace Healan.Application.Companies.Dtos;

public record ConsultingCompanyResult : IMapFrom<Company>
{
    public long CompanyId { get; set; }
    public string CompanyName { get; set; }
}
