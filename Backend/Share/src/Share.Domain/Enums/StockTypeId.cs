using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum StockTypeId : byte
    {
        [Display(Name = "بورس")]
        Tehran = 1,
        [Display(Name = "فرابورس")]
        IFB= 2,
    }
}
