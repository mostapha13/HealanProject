using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum FormStateId : int
    {
        [Display(Name = "")]
        None = 0,
        [Display(Name = "تایید شده")]
        Confirmed = 1,
        [Display(Name = "عدم تایید")]
        Rejected = 2
    }
}
