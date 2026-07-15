using Newtonsoft.Json;
using System;

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
