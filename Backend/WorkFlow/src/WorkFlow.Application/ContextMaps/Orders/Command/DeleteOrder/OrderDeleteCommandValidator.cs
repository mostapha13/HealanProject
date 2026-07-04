using FluentValidation;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.Orders.Command.DeleteOrder
{
    public class OrderDeleteCommandValidator : AbstractValidator<OrderDeleteCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public OrderDeleteCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            //RuleFor(a => a).Custom((dt, context) =>
            //{
            //    if (_applicationDbContext.WorkFlowUsers.Any(a => a.OrderId == dt.OrderId))
            //        context.AddFailure(ValidationMessages.CantDeleteOrder);
            //});
        }
    }
}
