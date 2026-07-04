using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.Logging
{
    public interface ITseCustomLogEnricher
    {
        string RequestId { get; set; }
    }
}
