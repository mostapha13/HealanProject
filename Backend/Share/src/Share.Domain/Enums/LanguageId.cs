using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum LanguageId : byte
    {
        [Display(Name = "فارسی")]
        Fa = 1,
        [Display(Name = "انگلیسی")]
        En = 2,
    }
}
