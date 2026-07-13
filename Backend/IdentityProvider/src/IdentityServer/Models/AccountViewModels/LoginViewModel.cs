using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class LoginViewModel
    {

        [Display(Name = "نام کاربری")]
        [Required(ErrorMessage = "نام کاربری وارد نشده است")]
        public string UserName { get; set; }

        [DataType(DataType.Password)]
        [Required(ErrorMessage = "رمز عبور وارد نشده است")]
        [Display(Name = "رمز عبور")]
        public string Password { get; set; }

        [Display(Name = "مرا به خاطر بسپار")]
        public bool RememberMe { get; set; }

        public string CaptchaKey { get; set; }
        public byte[] Image { get; set; }

        /// <summary>
        /// After a failed login, captcha is required. First attempt skips captcha.
        /// </summary>
        public bool ShowCaptcha { get; set; }

        [Display(Name = "کد کپچا")]
        public string CaptchaCode { get; set; }
        public string ReturnUrl { get; set; }
    }
}
