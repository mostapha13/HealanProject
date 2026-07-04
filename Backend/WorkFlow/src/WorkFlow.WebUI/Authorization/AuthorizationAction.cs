using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WorkFlow.WebUI.Authorization
{
    public enum AuthorizationAction : int
    {
        [Display(Name = "ایجاد کاربر",Order =1)]
        CreateUser = 1,
        [Display(Name = "سفارش بازارگردان", Order = 2)]
        SaveOrder = 2,
        [Display(Name = "تایید فرم", Order = 3)]
        ConfirmForm = 3
    }
}
