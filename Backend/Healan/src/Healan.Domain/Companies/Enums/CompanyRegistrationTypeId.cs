using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Companies.Enums;
public enum CompanyRegistrationTypeId : int
{
    [Display(Name = "بیمارستان")]
    Hospital = 1,
    [Display(Name = "کلینیک")]
    Clinic = 2,
    [Display(Name = "مطب")]
    Office = 3

}
