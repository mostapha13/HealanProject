using Healan.Domain.Appointments.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.GetAppointmentType;
    public class GetAppointmentTypeQuery:IRequest<List<EnumInfo>>
    {
    }

public class GetAppointmentTypeQueryHandler : IRequestHandler<GetAppointmentTypeQuery, List<EnumInfo>>
{
    public async Task<List<EnumInfo>> Handle(GetAppointmentTypeQuery request, CancellationToken cancellationToken)
    {
        return EnumExtensions.GetEnumInfo<AppointmentTypeId>();
    }
}
