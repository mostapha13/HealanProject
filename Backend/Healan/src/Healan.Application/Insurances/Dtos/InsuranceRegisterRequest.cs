using Healan.Domain.Insurances.Enums;

namespace Healan.Application.Insurances.Dtos;
public class InsuranceRegisterRequest
{
    public long InsuranceCompanyId { get; set; }
    public InsuranceTypeId InsuranceTypeId { get; set; }
    public string Name { get; set; }
    public string? Code { get; set; }
    public string? PhoneNumber { get; set; }
    public bool? IsActive { get; set; }
    public Guid? AttachmentId { get; set; }
}
