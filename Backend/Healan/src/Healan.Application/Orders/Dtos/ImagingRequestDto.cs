using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Orders.Enums;

namespace Healan.Application.Orders.Dtos;

public class ImagingRequestDto:IMapFrom<ImagingRequest>
{
    public long ImagingRequestId { get; set; }
    public long PrescriptionId { get; set; }
    public ImageTypeId ImageTypeId { get; set; }
    public string Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public AttachmentDto Attachment { get; set; }
    public void Mapping(Profile profile)
    {

        profile.CreateMap<ImagingRequest, ImagingRequestDto>()
               .ForMember(a => a.Attachment, b => b.MapFrom(c => c.Attachment))
            ;
    }
}