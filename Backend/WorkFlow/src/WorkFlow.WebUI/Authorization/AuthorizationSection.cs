using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WorkFlow.WebUI.Authorization
{
    public enum AuthorizationSection : int
    {
        [Display(Name = "کاربران", Order = 1)]
        Users = 1,
        [Display(Name = "بازارگردانی", Order = 2)]
        MarketMaking = 2
    }
}
