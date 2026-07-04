using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Share.Domain.Enums;
using Share.Domain.Exceptions;

namespace WorkFlow.Application.Common.Services
{
    public class WorkFlowGuidService : IWorkFlowGuidService
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ILogger<WorkFlowGuidService> _logger;
        public WorkFlowGuidService(IApplicationDbContext applicationDbContext, ILogger<WorkFlowGuidService> logger)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
        }
        public async Task<List<WorkFlowGuide>> GetNextWorkFlowGuidId(Guid currentWorkFlowGuideId, WeightId weightId)
        {
            var currentWorkFlowGuid = await _applicationDbContext.WorkFlowGuides.FirstOrDefaultAsync(p => p.WorkFlowGuideId == currentWorkFlowGuideId);
            if (currentWorkFlowGuid == null)
                throw new BadRequestExceptions("currentWorkFlowGuid Is Null!");

            Guid x = Guid.Empty;   
            if (currentWorkFlowGuid.Weight==0 || currentWorkFlowGuid.Weight==WeightId.Other)
            {
                x = currentWorkFlowGuid.WorkFlowGuideId;
            }
            else
            {
                var parent_x = await _applicationDbContext.WorkFlowGuides.FirstOrDefaultAsync(p => p.WorkFlowGuideId == currentWorkFlowGuid.ParentId);
                if (parent_x == null)
                    return null;

                var parent_parent_x = await _applicationDbContext.WorkFlowGuides.FirstOrDefaultAsync(p => p.WorkFlowGuideId == parent_x.ParentId);
                if (parent_parent_x == null)
                    return null;
                x = parent_parent_x.WorkFlowGuideId;


            }
            if (x == Guid.Empty)
                return null;
            var next = _applicationDbContext.WorkFlowGuides.Where(p => p.ParentId == x && p.Weight == weightId).ToList(); 
            return next;
        }
    }
}
