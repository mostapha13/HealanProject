using FluentValidation;
using Share.Application.Common.Constant;
using Share.Application.Common.Interfaces;

namespace WorkFlow.Application.Common.CustomValidator
{
    public class AbstractRequestBaseValidator<T> : AbstractValidator<T> where T : IAbstractSearchRequest
    {
        public AbstractRequestBaseValidator()
        {
            RuleFor(x => ((IAbstractSearchRequest)x).lang)
                .IsInEnum().WithMessage(ValidationMessages.LanguageIsRequired);

            RuleFor(x => ((IAbstractSearchRequest)x).PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage(ValidationMessages.PageNumberGreaterThanOrEqualTo);

            RuleFor(x => ((IAbstractSearchRequest)x).PageSize)
                .GreaterThanOrEqualTo(1).WithMessage(ValidationMessages.PageSizeGreaterThanOrEqualTo)
                .LessThanOrEqualTo(100).WithMessage(ValidationMessages.PageSizeLessThanOrEqualTo);
        }
    }
}
