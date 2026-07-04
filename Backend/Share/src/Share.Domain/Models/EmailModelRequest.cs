using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class EmailModelRequest
    {
        public EmailModelRequest()
        {
            EmailAddresses = new Collection<string>();
        }
        public string Subject { get; set; }
        public string Message { get; set; }
        /// <summary>
        /// Destination Numbers
        /// </summary>
        public ICollection<string> EmailAddresses { get; set; }

    }
}
