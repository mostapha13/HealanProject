using System;
using System.IO;

namespace CaptchaProvider.Domain.Entities
{
    public class CaptchaInfo
    {
        public Guid CaptchaInfoId { get; set; }
        public string Code { get; set; }
        public DateTime RequestTime { get; set; }
        public string RequestIp { get; set; }
        public string Result { get; set; }
    }
}
