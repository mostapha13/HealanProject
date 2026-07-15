using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
   public interface ISmsApiService
    {
        public Task<SMSModelResponce> SendSMS(SMSModelRequest sMSModelRequest);
        void ValidToSendSms(string phoneNumber);
        /// <summary>Remove cooldown so a new OTP can be sent (e.g. after password reset, or verified password login 2FA).</summary>
        void ClearSmsRateLimit(string phoneNumber);
    }
}
