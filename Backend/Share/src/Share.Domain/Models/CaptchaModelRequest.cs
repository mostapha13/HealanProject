using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class CaptchaModelRequest
    {
        public CaptchaModelRequest(string captchaKey,string captchaCode)
        {
            CaptchaCode = captchaCode;
            CaptchaKey = captchaKey;
        }
        public string CaptchaKey { get; set; }
        public string CaptchaCode { get; set; }

    }
}
