using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum DepartmentId : short
    {
        [Display(Name = "نامشخص")]
        None = 0,
        [Display(Name = "نرم افزار")]
        Software = 1,
        [Display(Name = "روابط عمومی")]
        PublicRelations = 2,
        [Display(Name = "کاربر عمومی")]
        Public = 3,
        [Display(Name = "پذیرش")]
        Healan = 4,
        [Display(Name = "پزشک")]
        Doctor=5,
        [Display(Name = "بازارگردان")]
        MarketMaker = 30,
    }
}
