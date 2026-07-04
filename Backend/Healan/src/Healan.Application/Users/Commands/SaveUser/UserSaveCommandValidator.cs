using FluentValidation;
using Healan.Application.Common.Interfaces;
using Share.Domain.Constants;
using System.Text.RegularExpressions;

namespace Healan.Application.Users.Commands.SaveUser
{
    public class UserSaveCommandValidator : AbstractValidator<UserSaveCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public UserSaveCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a.FirstName).NotEmpty().WithMessage("نام را به صورت صحیح وارد کنید").MinimumLength(2).WithMessage("نام را به صورت صحیح وارد کنید").MaximumLength(50).WithMessage("حداکثر طول نام 50 کاراکتر است");
            RuleFor(a => a.LastName).NotEmpty().WithMessage("نام خانوادگی را به صورت صحیح وارد کنید").MinimumLength(2).WithMessage("نام خانوادگی را به صورت صحیح وارد کنید").MaximumLength(100).WithMessage("حداکثر طول نام 100 کاراکتر است");
            RuleFor(a => a.PhoneNumber).NotEmpty().WithMessage("شماره همراه را به صورت صحیح وارد کنید");
            RuleFor(a => a.UserRoles).NotNull().Must(a => a != null && a.Count > 0).WithMessage("نقش کاربر مشخص نشده است.");
            RuleFor(a => a.PhoneNumber).MatchPhoneNumberRule();
            RuleFor(x => x)
                 .Custom((dt, context) =>
                 {
                     if (_applicationDbContext.Users.Any(a => a.UserId != dt.UserId && dt.PhoneNumber == a.PhoneNumber))
                         context.AddFailure("شماره همراه تکراری است");

                 });
        }
    }
    public static class PhoneNumberValidators
    {
        public static IRuleBuilderOptions<T, string> MatchPhoneNumberRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = "فرمت شماره همراه صحیح نیست")
        {
            var phoneNumberPattern = RegularExpressionPattern.PhoneNumberPattern;
            return ruleBuilder.Must(a => a != null && Regex.IsMatch(a, phoneNumberPattern)).WithMessage(message);
        }
    }
}
