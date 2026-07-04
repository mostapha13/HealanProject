using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Views.Enums;

public enum AcceptStatusId : int
{
    [Display(Name = "بررسی نشده")]
    None = 0,
    [Display(Name = "تایید شده")]
    Confirmed = 1,
    [Display(Name = "عدم تایید")]
    Rejected = 2,
}
