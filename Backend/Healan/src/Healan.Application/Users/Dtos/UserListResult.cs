
using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Companies.Dtos;
using Healan.Domain.Users.Entities;
using Healan.Domain.Users.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Users.Dtos
{
    public record UserListResult : IMapFrom<User>
    {
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        // public List<UserRole> UserRoles { get; set; }
        public string PersonnelNumber { get; set; }
        public string Landline { get; set; }
        public string PrefixNumber { get; set; }
        public CompanyResponse Company { get; set; }
        public string ExtensionCompanyPhoneNumber { get; set; }
        public UserTypeId UserTypeId { get; set; }
        public string UserTypeName { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<User, UserListResult>()
                .ForMember(a => a.UserTypeName, b => b.MapFrom(c => c.UserTypeId.GetDisplayName()))
                .ForMember(a => a.FullName, b => b.MapFrom(c => $"{c.FirstName} {c.LastName}"));
        }
    }
}
