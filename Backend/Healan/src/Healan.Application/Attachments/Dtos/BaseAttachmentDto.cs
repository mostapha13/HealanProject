using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Attachments.Entities;

namespace Healan.Application.Attachments.Dtos;
public record BaseAttachmentDto : IMapFrom<Attachment>
{
    public Guid? TableId { get; set; }
    public AttachmentDto Attachment { get; set; }


    public virtual void Mapping(Profile profile)
    {
        profile.CreateMap<Attachment, BaseAttachmentDto>()
             .ForMember(dest => dest.Attachment, opt => opt.MapFrom(src => src))
             .ForMember(dest => dest.TableId, opt => opt.MapFrom(_ => Guid.NewGuid()));
    }
}