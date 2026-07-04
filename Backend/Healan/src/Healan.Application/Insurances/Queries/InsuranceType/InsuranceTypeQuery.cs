using Healan.Domain.Insurances.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Queries.InsuranceType
{
    public class InsuranceTypeQuery:IRequest<List<EnumInfo>>
    {
    }

    public class InsuranceTypeQueryHandler : IRequestHandler<InsuranceTypeQuery, List<EnumInfo>>
    {
        public async Task<List<EnumInfo>> Handle(InsuranceTypeQuery request, CancellationToken cancellationToken)
        {
            return EnumExtensions.GetEnumInfo<InsuranceTypeId>();
        }
    }
}
