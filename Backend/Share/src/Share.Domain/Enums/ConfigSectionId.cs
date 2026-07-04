using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum ConfigSectionId : int
    {
        [Display(Name = "دیدبان من")]
        MarketWatch = 1,
    }
}
