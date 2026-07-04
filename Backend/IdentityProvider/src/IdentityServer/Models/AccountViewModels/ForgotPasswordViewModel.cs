using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class ForgotPasswordViewModel
    {
        [Required(ErrorMessage = "شماره همراه وارد نشده است")]
        //[EmailAddress]
        [DisplayName("شماره همراه")]
        public string PhoneNumber { get; set; }

        public string CaptchaKey { get; set; }
        public byte[] Image { get; set; }

        [Required(ErrorMessage = "کد کپچا وارد نشده است")]
        [Display(Name = "کد کپچا")]
        public string CaptchaCode { get; set; }

        public string ReturnUrl { get; set; }
    }
}
