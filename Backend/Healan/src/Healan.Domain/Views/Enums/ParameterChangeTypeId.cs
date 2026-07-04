using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Views.Enums;

public enum ParameterChangeTypeId : byte
{
    [Display(Name = "ثبت")]
    Save = 0,
    [Display(Name = "نظر مدیریت")]
    ManagementOpinion = 1,
    [Display(Name = "افزایش سرمایه")]
    CapitalIncrease = 2,
    [Display(Name = "طبقات نقد شوندگی")]
    liquidity = 3

}
