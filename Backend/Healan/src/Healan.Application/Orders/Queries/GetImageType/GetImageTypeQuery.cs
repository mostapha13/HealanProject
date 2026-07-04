using Healan.Domain.Orders.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Orders.Queries.GetImageType;
    public class GetImageTypeQuery:IRequest<List<EnumInfo>>
    {
    }

public class GetImageTypeQueryHandler : IRequestHandler<GetImageTypeQuery, List<EnumInfo>>
{
    public async Task<List<EnumInfo>> Handle(GetImageTypeQuery request, CancellationToken cancellationToken)
    {
        return EnumExtensions.GetEnumInfo<ImageTypeId>();
    }
}
