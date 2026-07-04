using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Users.Enums;

public enum MarketMakerAccessRequestStateId : byte
{
    [Display(Name = "در انتظار تایید")]
    Created = 1,
    [Display(Name = "تایید شده")]
    Confirmed = 2,
    [Display(Name = "برگشت خورده")]
    Rejected = 3,
}