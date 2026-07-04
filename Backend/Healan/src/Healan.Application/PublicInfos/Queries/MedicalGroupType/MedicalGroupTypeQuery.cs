using Healan.Domain.Doctors.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.PublicInfos.Queries.MedicalGroupType;
    public class MedicalGroupTypeQuery:IRequest<List<EnumInfo>>
    {
    }

public class MedicalGroupTypeQueryHandler : IRequestHandler<MedicalGroupTypeQuery, List<EnumInfo>>
{
    public async Task<List<EnumInfo>> Handle(MedicalGroupTypeQuery request, CancellationToken cancellationToken)
    {
        return EnumExtensions.GetEnumInfo<MedicalGroupTypeId>();
    }
}
