using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class CallSMSModelRequest
    {
        public string Message { get; set; }
        public string PhoneNumber { get; set; }
    }
}
