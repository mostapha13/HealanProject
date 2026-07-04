//using AutoMapper;
//using AutoMapper.QueryableExtensions;
//using Healan.Application.Common.Interfaces;
//using Healan.Application.Companies.Dtos;
//using Healan.Application.Doctors.Dtos;
//using Healan.Domain.Doctors.Entities;
//using MediatR;
//using Microsoft.EntityFrameworkCore;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Healan.Application.Doctors.Queries.DoctorType;
//public class MedicalGroupQuery:IRequest<List<MedicalGroupResult>>
//{
//}

//public class DoctorTypeQueryHandler : IRequestHandler<MedicalGroupQuery, List<MedicalGroupResult>>
//{
//    private readonly IApplicationDbContext _applicationDbContext;
//    private readonly IMapper _mapper;

//    public DoctorTypeQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
//    {
//        _applicationDbContext = applicationDbContext;
//        _mapper = mapper;
//    }
//    public async Task<List<MedicalGroupResult>> Handle(MedicalGroupQuery request, CancellationToken cancellationToken)
//    {
//        return await _applicationDbContext.MedicalGroupTypes.ProjectTo<MedicalGroupResult>(_mapper.ConfigurationProvider).ToListAsync();
//    }
//}
