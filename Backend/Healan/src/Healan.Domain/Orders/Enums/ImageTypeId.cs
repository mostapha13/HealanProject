using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Orders.Enums;
    public enum ImageTypeId:byte
    {
    [Display(Name ="نوار قلب")]
    ECG=1,
    [Display(Name = "اکوکاردیوگرافی")]
    Echocardiography=2,
    [Display(Name = "تست ورزش")]
    ExerciseStressTest = 3,
    [Display(Name = "هولتر ریتم")]
    HolterRhythmMonitor = 4,
    [Display(Name = "هولتر فشار")]
    AmbulatoryBloodPressureMonitoring = 5,
    [Display(Name = "اکوکاردیوگرافی")]
    MRI =6
}
