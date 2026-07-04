using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.DTOs
{
    public class CaptchaInfoResult
    {
        public string CaptchaKey { get; set; }
        public byte[] Image { get; set; }
    }
}
