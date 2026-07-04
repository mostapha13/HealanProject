using MediatR;
using Share.Domain.Attributes;
using Share.Domain.Enums;

namespace Share.Application.Common.Models
{
    public abstract class AbstractRequestBase<T> : IRequest<T>
    {
        [HealanFromRoute]

        public LanguageId lang { get; set; } = LanguageId.Fa;

    }
}
