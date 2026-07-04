using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class CaptchaModelResponse
    {
        [JsonProperty("captchaKey")]
        public Guid CaptchaKey { get; set; }

        [JsonProperty("image")]
        public byte[] Image { get; set; }

    }
}
