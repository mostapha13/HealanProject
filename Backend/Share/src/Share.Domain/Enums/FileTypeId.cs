using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum FileTypeId : short
    {
        [Display(Name = "تصویر")]
        Image = 1,
        [Display(Name = "ویدیو")]
        Video = 2,
        [Display(Name = "سند")]
        Document = 3,
        [Display(Name = "اکسل")]
        Excel = 4,
        [Display(Name = "PDF")]
        PDF = 5,
    }
}
