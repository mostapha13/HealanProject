using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Doctors.Enums;
public enum MedicalGroupTypeId : int
{
    [Display(Name = "عمومی")]
    General = 1,
    [Display(Name = "داخلی")]
    Internal = 2,
    [Display(Name = "قلب")]
    Heart = 3,
    [Display(Name = "جراح عمومی")]
    GeneralSurgeon = 4

}
