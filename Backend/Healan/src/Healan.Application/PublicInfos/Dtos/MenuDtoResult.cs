using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Companies.Dtos;
using Healan.Domain.Menus.Entities;
using Healan.Domain.Menus.Enums;

namespace Healan.Application.PublicInfos.Dtos;

public record MenuInfoResult : IMapFrom<Menu>
{
    public CompanyInfo Company { get; set; }
    public List<MenuInfo> Menus { get; set; }

    //public ShowBtnDto ShowComplete { get; set; }
    //public ShowBtnDto ShowAdmission { get; set; }
    //public ShowBtnDto ShowProcessPublicOffering { get; set; }
    //public ShowBtnDto ShowProcessBeingListed { get; set; }
    //public ShowBtnDto ShowPubliclyOffered { get; set; }
    //public ShowBtnDto ShowAdmissionsBoardAgain { get; set; }
    //public ShowBtnDto ShowRejected { get; set; }
    //public ShowBtnDto ShowWithdrawn { get; set; }
    //public ShowBtnDto ShowSuspended { get; set; }

    public void Mapping(Profile profile)
    {
        profile.CreateMap<Menu, MenuInfoResult>()
          .ForMember(a => a.Menus, b => b.MapFrom(c => c));
    }


}

public record MenuInfo : IMapFrom<Menu>
{
    public int MenuId { get; set; }
    public string MenuTitle { get; set; }
    public float? Progress { get; set; }
    public HealanTypeId HealanTypeId { get; set; }
    public bool Enable { get; set; }
    public int DossierId { get; set; }
}
public record MenuDtoResult : IMapFrom<Menu>
{
    public int MenuId { get; set; }
    public string MenuTitle { get; set; }
    //public int MenuWeight { get; set; }
    public float Progress { get; set; }
    public HealanTypeId HealanTypeId { get; set; }
    public ICollection<SubmenuDto> Submenus { get; set; }

}

public record SubmenuDto : IMapFrom<Submenu>
{
    public int SubmenuId { get; set; }
    public int MenuId { get; set; }
    public int SubmenuRow { get; set; }
    public string SubmenuTitle { get; set; }
    //public int SubmenuWeight { get; set; }
    public bool HasSignature { get; set; }
    public string ComponentName { get; set; }
    public string SaveApiName { get; set; }
    public string FindApiName { get; set; }
    public string ConfirmApiName { get; set; }
    public string RejectApiName { get; set; }
    public string? ListApiName { get; set; }
    public string? SignatureSaveApiName { get; set; }
    public string? LastValue { get; set; }
    public Dictionary<string, string> Label { get; set; }
   

}

 


public record ShowBtnDto
{
    public bool Enable { get; set; } = false;
    public string? FullName { get; set; }
    public DateTime? CreatedDate { get; set; }
}