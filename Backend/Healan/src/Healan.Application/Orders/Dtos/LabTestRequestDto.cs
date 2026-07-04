using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Orders.Entities;

namespace Healan.Application.Orders.Dtos;

public class LabTestRequestDto : IMapFrom<LabTestRequest>
{
    public long LabTestRequestId { get; set; }
    public long PrescriptionId { get; set; }
    public string LabTestType { get; set; }
    public string Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public void Mapping(Profile profile)
    {

        profile.CreateMap<LabTestRequest, LabTestRequestDto>();
    }
}
