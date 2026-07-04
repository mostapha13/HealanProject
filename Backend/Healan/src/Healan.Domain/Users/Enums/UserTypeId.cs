using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Users.Enums;
public enum UserTypeId : int
{
    [Display(Name = "رئیس")]
    Boss = 1,
    [Display(Name = "مدیر")]
    Manager = 2,
    [Display(Name = "منشی")]
    Secretary = 3,
    [Display(Name = "پرستار")]
    Nurse = 4,
    [Display(Name = "کمک پرستار")]
    NurseHelp = 5,
    [Display(Name = "کاربر عمومی")]
    PublicUser = 6,
    [Display(Name = "پزشک")]
    Doctor = 7,
    [Display(Name = "حسابدار")]
    Accountant = 8,
    [Display(Name = "بیمار")]
    Patient = 9

}
