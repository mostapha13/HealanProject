
using CaptchaProvider.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.Configs
{
   public class CaptchaConfig
    {
        public CaptchaFormat CaptchaFormat { get; set; }
        public CaptchaNoise CaptchaNoise { get; set; }
        public byte DigitNumber { get; set; }
        public int ValidityDuration { get; set; }
    }
}
