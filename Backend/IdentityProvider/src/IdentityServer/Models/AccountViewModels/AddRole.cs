using IdentityServer;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Models.AccountViewModels
{
    public class AddRole
    {
        [Required(ErrorMessage = ConstMessage.RequiredErrorMessage, AllowEmptyStrings = false)]
        [StringLength(256, ErrorMessage = ConstMessage.StringLengthErrorMessage)]
        [Display(Name = "عنوان")]
        public string Title { get; set; }
    }
}
