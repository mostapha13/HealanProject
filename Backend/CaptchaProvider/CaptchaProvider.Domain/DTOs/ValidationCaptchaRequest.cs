using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.DTOs
{
    public class ValidationCaptchaRequest
    {
        public string CaptchaKey { get; set; }
        public string CaptchaCode { get; set; }
    }
}
