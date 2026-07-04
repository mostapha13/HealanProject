using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Insurances.Enums;
public enum InsuranceTypeId : int
{
    [Display(Name = "آزاد")]
    None = 1,
    [Display(Name = "بیمه اصلی")]
    Primary = 2,
    [Display(Name = "بیمه تکمیلی")]
    Secondary = 3,
}

