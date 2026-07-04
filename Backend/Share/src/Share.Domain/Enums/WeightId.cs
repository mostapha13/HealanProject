using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum WeightId : int
    {
        [Display(Name = "بعدی")]
        Next = 0,
        [Display(Name = "قبلی")]
        Back = 1,
        [Display(Name = "رد")]
        Other = 2
    }
}
