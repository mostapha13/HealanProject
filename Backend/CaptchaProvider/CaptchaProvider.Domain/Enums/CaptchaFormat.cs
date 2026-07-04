using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.Enums
{

    public enum CaptchaFormat : short
    {
        [Display(Name = "عدد")]
        Number = 1,
        [Display(Name = "حروف")]
        Character = 2,
        [Display(Name = "جمع")]
        Sum = 3,
        [Display(Name = "تفریق")]
        Submission =4,
        [Display(Name = "ضرب")]
        Multiple = 5,
        [Display(Name = "تلفیقی")]
        Hybrid = 6,
    }
}
