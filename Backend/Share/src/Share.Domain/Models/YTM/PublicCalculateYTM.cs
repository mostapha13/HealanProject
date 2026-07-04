using Share.Domain.Models.InstrumentModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.YTM
{
    public class PublicCalculateYTM
    {
        public DateTime? DueDate { get; set; }
        public InstrumentIds InstrumentIds { get; set; }
    }

}
