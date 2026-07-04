using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Attachments.Entities;

namespace Healan.Application.Attachments.Dtos;

/// <summary>
/// اطلاعات فایل
/// </summary>
//
public record AttachmentDto : IMapFrom<Attachment>
{

    /// <summary>
    /// لینک فایل
    /// </summary>
    public string Link { get; set; }
    /// <summary>
    /// نام فایل
    /// </summary>
    public string FileName { get; set; }
    /// <summary>
    /// Id فایل
    /// </summary>
    public Guid FileId { get; set; }

    /// <summary>
    /// نوع فایل
    /// </summary>
    public string FileType { get; set; }

    public virtual void Mapping(Profile profile)
    {
        profile.CreateMap<Attachment, AttachmentDto>();
    }
}
