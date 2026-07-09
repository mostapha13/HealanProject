using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Orders.Enums;

public enum ImageTypeId : byte
{
    [Display(Name = "نوار قلب")]
    ECG = 1,

    [Display(Name = "اکوکاردیوگرافی")]
    Echocardiography = 2,

    [Display(Name = "تست ورزش")]
    ExerciseStressTest = 3,

    [Display(Name = "هولتر ریتم")]
    HolterRhythmMonitor = 4,

    [Display(Name = "هولتر فشار")]
    AmbulatoryBloodPressureMonitoring = 5,

    [Display(Name = "ام آر آی")]
    MRI = 6,

    [Display(Name = "برگه گزارش کلی")]
    GeneralReport = 7,
}
