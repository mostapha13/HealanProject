using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class ResetPasswordViewModel
    {
        [Required(ErrorMessage = "شماره همراه مشخص نشده است")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "رمز عبور وارد نشده است")]
        [Display(Name = "رمز عبور")]
        [StringLength(100, ErrorMessage = "طول رمز عبور حداقل باید 6 رقم باشد", MinimumLength = 6)]
        [DataType(DataType.Password)]
        public string Password { get; set; }


        [Required(ErrorMessage = "تکرار رمز عبور وارد نشده است")]
        [DataType(DataType.Password)]
        [Display(Name = "تکرار رمز عبور")]
        [Compare("Password", ErrorMessage = "رمز عبور با تکرار آن برابر نیست")]
        public string ConfirmPassword { get; set; }

        [Required(ErrorMessage = "کد ارسال شده وارد نشده است")]
        [Display(Name = "کد ارسال شده")]
        public string Code { get; set; }


        public string CaptchaKey { get; set; }
        public byte[] Image { get; set; }

        [Required(ErrorMessage = "کد کپچا وارد نشده است")]
        [Display(Name = "کد کپچا")]
        public string CaptchaCode { get; set; }



        public string ReturnUrl { get; set; }
    }
}
