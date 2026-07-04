using FluentValidation;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Orders.Command.SaveOrder
{
    public class OrderSaveCommandValidator : AbstractValidator<OrderSaveCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public OrderSaveCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;

        }
        private bool BeAValidDate(DateTime date)
        {
            return !date.Equals(default);
        }
    }
}
