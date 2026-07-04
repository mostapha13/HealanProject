using FluentValidation;
using FluentValidation.Validators;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Share.Domain.Constants;
using System.Text.RegularExpressions;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser
{
    public class WorkFlowUserSaveCommandValidator : AbstractValidator<WorkFlowUserSaveCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowUserSaveCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a.FirstName).NotEmpty().WithMessage(ValidationMessages.FirstNameIsNotValid).MinimumLength(2).WithMessage(ValidationMessages.FirstNameIsNotValid).MaximumLength(50).WithMessage(ValidationMessages.FirstNameIsNotValid);
            RuleFor(a => a.LastName).NotEmpty().WithMessage(ValidationMessages.LastNameIsNotValid).MinimumLength(2).WithMessage(ValidationMessages.LastNameIsNotValid).MaximumLength(100).WithMessage(ValidationMessages.LastNameIsNotValid);
            RuleFor(a => a.PhoneNumber).NotEmpty().WithMessage(ValidationMessages.PhoneNumberShouldHasValue);
            RuleFor(a => a.PhoneNumber).MatchPhoneNumberRule();
            RuleFor(a => a.WorkFlowUserGroup).NotNull().WithMessage(ValidationMessages.UserGroupShouldHasValue);
            //RuleFor(a => a.Fund).NotNull().WithMessage(ValidationMessages.FundShouldHasValue);
        }
    }
    public static class PhoneNumberValidators
    {
        public static IRuleBuilderOptions<T, string> MatchPhoneNumberRule<T>(this IRuleBuilder<T, string> ruleBuilder, string message = ValidationMessages.PhoneNumberIsNotValid)
        {
            var phoneNumberPattern = RegularExpressionPattern.PhoneNumberPattern;
            return ruleBuilder.Must(a => a != null && Regex.IsMatch(a, phoneNumberPattern)).WithMessage(message);
        }
    }
}
