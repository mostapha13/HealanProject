using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum DateType : byte
    {
        [Display(Name = "شمسی")]
        SolarDate = 1,
        [Display(Name = "میلادی")]
        GregorianDate= 2,
    }
}
