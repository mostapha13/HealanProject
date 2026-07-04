using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WorkFlow.WebUI.Authorization
{
    public enum AuthorizationRole : int
    {
        [Display(Name = "ادمین", Order = 1)]
        MM_Admin = 1,
        [Display(Name = "بازارگردان", Order = 2)]
        MM_WorkFlow = 2,
        [Display(Name = "کارشناس", Order = 3)]
        MM_Expert = 3,
        [Display(Name = "رئیس اداره", Order = 4)]
        MM_OfficeBoss = 4,
        [Display(Name = "مدیر", Order = 5)]
        MM_Manager = 5,

    }
}
