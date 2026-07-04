using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum ContentStatusId : byte
    {
        [Display(Name = "پیش نویس")]
        Draft = 1,
        [Display(Name = "انتشار به صورت خودکار")]
        AutoPublish = 2,
        [Display(Name = "انتشار یافته")]
        Published = 3,
        [Display(Name = "حذف شده")]
        Deleted = 4,
    }
}
