using CaptchaProvider.Domain.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaptchaProvider.Domain.Services
{
   public interface ICaptchaService
    {
        Task<bool> ValidateCaptcha(ValidationCaptchaRequest validationCaptchaRequest);
        Task<CaptchaInfoResult> GetCaptchaInfoResult();
    }
}
