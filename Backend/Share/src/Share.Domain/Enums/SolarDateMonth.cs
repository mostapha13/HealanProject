using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum SolarDateMonth : byte
    {
        [Display(Name = "فروردین")]
        Farvardin = 1,
        [Display(Name = "اردیبهشت")]
        Ordibehesht= 2,
        [Display(Name = "خرداد")]
        Khordad = 3,


        [Display(Name = "تیر")]
        Tir = 4,
        [Display(Name = "مرداد")]
        Mordad = 5,
        [Display(Name = "شهریور")]
        Shahrivar = 6,

        [Display(Name = "مهر")]
        Mehr = 7,
        [Display(Name = "آبان")]
        Aban = 8,
        [Display(Name = "آذر")]
        Azar = 9,

        [Display(Name = "دی")]
        Day = 10,
        [Display(Name = "بهمن")]
        Bahman = 11,
        [Display(Name = "اسفند")]
        Esfand = 12,
    }
}
