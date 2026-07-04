using FluentValidation;
using Healan.Application.Common.Interfaces;
using Share.Domain.Constants;
using System.Text.RegularExpressions;

namespace Healan.Application.Companies.Commands.CompanyRegister;
public class CompanyRegisterCommandValidator : AbstractValidator<CompanyRegisterCommand>
{
    private readonly IApplicationDbContext _applicationDbContext;
    public CompanyRegisterCommandValidator(IApplicationDbContext applicationDbContext)
    {
        _applicationDbContext = applicationDbContext;


        RuleFor(a => a.CompanyName).NotEmpty().WithMessage("نام شرکت را به صورت صحیح وارد کنید").MinimumLength(2).WithMessage("نام شرکت را به صورت صحیح وارد کنید").MaximumLength(100).WithMessage("حداکثر طول نام 100 کاراکتر است");
        RuleFor(a => a.NationalId).NotEmpty().WithMessage("شناسه ملی شرکت را به صورت صحیح وارد کنید").MaximumLength(50).WithMessage("حداکثر طول شناسه ملی 50 کاراکتر است");


        RuleFor(x => x)
             .Custom((dt, context) =>
             {
                 if (dt.Email != null)
                     RuleFor(a => a.Email).MatchEmailRule().WithMessage(RegularExpressionErrorMessage.EmailAddressErrorMessage);

                 if (dt.WebSite != null)
                     RuleFor(a => a.WebSite).MatchWebsiteRule().WithMessage(RegularExpressionErrorMessage.WebsiteErrorMessage);

                 if (dt.Landline != null)
                     RuleFor(a => a.Landline).MatchLandlineRule().WithMessage(RegularExpressionErrorMessage.LandLineErrorMessage);

                 if (dt.PrefixNumber != null)
                     RuleFor(a => a.PrefixNumber).MatchPrefixNumberRule().WithMessage(RegularExpressionErrorMessage.PrefixNumberErrorMessage);

             });


        RuleFor(x => x)
             .Custom((dt, context) =>
             {
                 if (_applicationDbContext.Companies.Any(a => a.NationalId.Equals(dt.NationalId)) && dt.CompanyId is null)
                     context.AddFailure($"شناسه ملی ({dt.NationalId}) شرکت قبلا در سیستم تعریف شده است");
             });

        RuleFor(x => x)
       .Custom((dt, context) =>
       {
           if (dt.RegistrationNumber != null)
           {
               if (_applicationDbContext.Companies.Any(a => a.RegistrationNumber.Equals(dt.RegistrationNumber)) && dt.CompanyId is null)
                   context.AddFailure($"شماره ثبت {dt.RegistrationNumber} قبلا در سیستم تعریف شده است");
           }

       });


    }
}

public static class LandlineValidators
{
    public static IRuleBuilderOptions<T, string> MatchLandlineRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = RegularExpressionErrorMessage.LandLineErrorMessage)
    {
        var landlinePattern = RegularExpressionPattern.LandLinePattern;
        return ruleBuilder.Must(a => a != null && Regex.IsMatch(a, landlinePattern)).WithMessage(message);
    }

}
public static class PrefixNumberValidators
{
    public static IRuleBuilderOptions<T, string> MatchPrefixNumberRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = RegularExpressionErrorMessage.PrefixNumberErrorMessage)
    {
        var prefixNumberPattern = RegularExpressionPattern.PrefixNumberPattern;
        return ruleBuilder.Must(a => a != null && Regex.IsMatch(a, prefixNumberPattern)).WithMessage(message);
    }
}
public static class EmailValidators
{
    public static IRuleBuilderOptions<T, string> MatchEmailRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = RegularExpressionErrorMessage.EmailAddressErrorMessage)
    {
        var emailPattern = RegularExpressionPattern.EmailAddressPattern;
        return ruleBuilder.Must(a => a != null && Regex.IsMatch(a, emailPattern, RegexOptions.IgnoreCase)).WithMessage(message);
    }
}

public static class WebsiteValidators
{
    public static IRuleBuilderOptions<T, string> MatchWebsiteRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = RegularExpressionErrorMessage.WebsiteErrorMessage)
    {
        var WebsitePattern = RegularExpressionPattern.WebsitePattern;
        return ruleBuilder.Must(a => a != null && Regex.IsMatch(a.Trim(), WebsitePattern, RegexOptions.IgnoreCase)).WithMessage(message);
    }

}