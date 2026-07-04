//using AutoMapper;
//using Healan.Application.Common.Dtos;
//using Healan.Application.Common.Mappings;
//using Healan.Domain.Insurances.Entities;
//using Share.Domain.Extensions;

//namespace Healan.Application.Insurances.Dtos;

//public class InsuranceLogoSummaryResult : IMapFrom<InsuranceLogo>
//{
//    public long InsuranceLogoId { get; set; }
//    public long InsuranceId { get; set; }
//    public string InsuranceName { get; set; }
//    public string InsuranceTypeName { get; set; }
//    public AttachmentDto Attachment { get; set; }

//    public void Mapping(Profile profile)
//    {

//        profile.CreateMap<InsuranceLogo, InsuranceLogoSummaryResult>()
//            .ForMember(a => a.InsuranceName, b => b.MapFrom(c => c.Insurance.InsuranceName))
//            .ForMember(a => a.InsuranceTypeName, b => b.MapFrom(c => c.Insurance.InsuranceTypeId.GetDisplayName()))
//            .ForMember(a => a.Attachment, b => b.MapFrom(c => c.Attachment))
//            ;
//    }
//}