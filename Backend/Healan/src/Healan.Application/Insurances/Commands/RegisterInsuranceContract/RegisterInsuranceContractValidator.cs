using FluentValidation;
using Healan.Application.Common.Interfaces;
using Healan.Application.MedicalFeeServices.Commands.MedicalFeeServiceRegister;
using Healan.Domain.Common.Const;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Commands.RegisterInsuranceContract
{
    public class RegisterInsuranceContractValidator : AbstractValidator<RegisterInsuranceContractCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;

        public RegisterInsuranceContractValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;

            RuleFor(a => a.InsuranceCompanyId).NotNull().NotEmpty().WithMessage("نام شرکت بیمه اجباری می باشد.");


            RuleFor(x => x)
                 .Custom((dt, context) =>
                 {

                     if (_applicationDbContext.InsuranceContracts.Any(x => x.InsuranceContractId == dt.InsuranceContractId && x.IsActive))
                     {
                         context.AddFailure(StringConstants.InsuranceContractHasActive);
                     }

                 });
        }



    }
}
