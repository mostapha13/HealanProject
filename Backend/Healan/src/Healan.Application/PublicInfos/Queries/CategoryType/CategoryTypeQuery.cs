using Healan.Domain.MedicalFeeServices.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.PublicInfos.Queries.CategoryType;
    public class CategoryTypeQuery:IRequest<List<EnumInfo>>
    {
    }

public class CategoryTypeQueryHandler : IRequestHandler<CategoryTypeQuery, List<EnumInfo>>
{
    public async Task<List<EnumInfo>> Handle(CategoryTypeQuery request, CancellationToken cancellationToken)
    {
        return EnumExtensions.GetEnumInfo<CategoryTypeId>();
    }
}

