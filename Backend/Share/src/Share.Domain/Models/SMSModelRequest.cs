using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class SMSModelRequest
    {
        public SMSModelRequest()
        {
            PhoneNumbers = new Collection<string>();
        }
        public string Message { get; set; }
        /// <summary>
        /// Destination Numbers
        /// </summary>
        public ICollection<string> PhoneNumbers { get; set; }

    }
}
