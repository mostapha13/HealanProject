using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.InstrumentModel
{
    public class InstrumentIds
    {
        public InstrumentIds()
        {
            Ids = new List<string>();
        }
        public List<string> Ids { get; set; }
    }
}
