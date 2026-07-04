using IdentityServer;
using Share.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class AddUser
    {
        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [StringLength(256, ErrorMessage = ConstMessage.StringLengthErrorMessage)]
        [Display(Name = "نام")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [StringLength(256, ErrorMessage = ConstMessage.StringLengthErrorMessage)]
        [Display(Name = "نام خانوادگی")]
        public string LastName { get; set; }

        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [StringLength(256, ErrorMessage = ConstMessage.StringLengthErrorMessage)]
        [Display(Name = "شماره همراه")]
        public string UserName { get; set; }

        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [StringLength(256, ErrorMessage = ConstMessage.StringLengthErrorMessage)]
        [Display(Name = "رمز عبور")]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "رمز عبور با تکرار رمز عبور یکسان نیست")]
        [Display(Name = "تکرار رمز عبور")]
        public string ConfirmPassword { get; set; }

        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [Display(Name = "نقش کاربر")]
        public string[] RoleId { get; set; }

        [Display(Name = "قسمت")]
        [EnumDataType(typeof(DepartmentId))]
        public DepartmentId DepartmentId { get; set; }

    }
}
