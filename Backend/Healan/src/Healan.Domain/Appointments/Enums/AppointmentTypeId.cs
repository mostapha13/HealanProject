using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Appointments.Enums;

public enum AppointmentTypeId : byte
{
    [Display(Name = "نوبت رزرو شده و هنوز شروع نشده")]
    Scheduled = 1,
    [Display(Name = "ویزیت در حال انجام")]
    InProgress = 2,
    [Display(Name = "ویزیت با موفقیت انجام شد")]
    Completed = 3,
    [Display(Name = "نوبت لغو شد")]
    Cancelled = 4,
    [Display(Name = "بیمار حاضر نشده")]
    NoShow = 5,
    [Display(Name = "نوبت به زمان دیگری منتقل شد")]
    ReScheduled = 6
}