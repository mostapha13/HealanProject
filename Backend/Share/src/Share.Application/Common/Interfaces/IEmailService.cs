using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
   public interface IEmailService
    {
        public Task<EmailModelResponce> SendEmail(EmailModelRequest sMSModelRequest);
    }
}
