using Microsoft.AspNetCore.Mvc.ModelBinding;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class DateFilterRequiredYear
    {
        [BindRequired]
        public int Year { get; set; }
        public int? Month { get; set; }
        public int? Day { get; set; }

        public int? FromYear { get; set; }
        public int? FromMonth { get; set; }
        public int? FromDay { get; set; }
    }
}
