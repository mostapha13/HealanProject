using FluentValidation;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Common.Const;
using IdentityServer.GrpcClient.Interfaces;
using Share.Application.Common.Interfaces;

namespace Healan.Application.MedicalFeeServices.Commands.MedicalFeeServiceRegister;
public class MedicalFeeServiceRegisterValidator : AbstractValidator<MedicalFeeServiceRegisterCommand>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdentityTool _identityTool;

    public MedicalFeeServiceRegisterValidator(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IIdentityTool identityTool)
    {
        _applicationDbContext = applicationDbContext;
        _currentUserService = currentUserService;
        _identityTool = identityTool;

        RuleFor(a => a.Price).NotNull().NotEmpty().WithMessage("قیمت تعرفه اجباری می باشد.");


        RuleFor(x => x)
             .Custom((dt, context) =>
             {     

                 if (_applicationDbContext.MedicalFeeServices.Any(x => x.ServiceTypeId == dt.ServiceTypeId && x.IsActive))
                 {
                         context.AddFailure(StringConstants.ServiceFeeHasActive);                     
                 }

             });

    }

}

