using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.Enums
{

    public enum CaptchaNoise : short
    {
        [Display(Name = "کم")]
        Low = 1,
        [Display(Name = "متوسط")]
        Medium = 2,
        [Display(Name = "زیاد")]
        High = 3,
    }
}
