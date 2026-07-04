using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Patients.Enums;
public enum PatientVisitTypeId
{
    [Display(Name = "اکو")]
    Echo = 1,
    [Display(Name = "نوار قلب")]
    Ecg = 2,
}
