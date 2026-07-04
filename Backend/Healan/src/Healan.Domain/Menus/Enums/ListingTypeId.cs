using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Menus.Enums;
public enum HealanTypeId : byte
{
    [Display(Name = "پذیرش سهام")]
    HealanAcceptance = 1,
    [Display(Name = "پذیرش بدهی")]
    HealanDebit = 2,
    [Display(Name = "پذیرش صندوق سرمایه گذاری")]
    HealanInvestment = 3,
}

