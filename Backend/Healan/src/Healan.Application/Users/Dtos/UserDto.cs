using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Users.Entities;

namespace Healan.Application.Users.Dtos
{
    public record UserDto : IMapFrom<User>
    {
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Landline { get; set; }
        public string? PrefixNumber { get; set; }
        public AttachmentDto Attachment { get; set; }


        public void Mapping(Profile profile)
        {
            profile.CreateMap<User, UserDto>()

                .ForMember(a => a.FullName, b => b.MapFrom(c => $"{c.FirstName} {c.LastName}"))
                //.ForMember(a => a.Attachment, b => b.MapFrom(c => c.Attachment))

            ;

        }

    }
}
