using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class LoginWith2faViewModel
    {
        [Required]
        //[StringLength(7, ErrorMessage = "کد ورود دومرحله ای باید 6 رقم باشد.", MinimumLength = 6)]
        [DataType(DataType.Text)]
        [Display(Name = "کد ارسال شده")]
        public string TwoFactorCode { get; set; }

        [Display(Name = "این ماشین رو به خطر بسپار")]
        public bool RememberMachine { get; set; }

        [Display(Name = "مرا به خاطر بسپار")]
        public bool RememberMe { get; set; }
        public string ReturnUrl { get; set; }
    }
}
