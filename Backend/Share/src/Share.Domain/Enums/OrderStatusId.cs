using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum OrderStatusId : byte
    {
        [Display(Name = "جاری")]
        Open = 1,
        [Display(Name = "پایان یافته")]
        Closed = 2,
        [Display(Name = "موقت")]
        Draft = 3
    }
}
