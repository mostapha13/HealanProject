using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Application.Common.Interfaces
{
    public interface IWorkFlowGuidService
    {
        Task<List<WorkFlowGuide>> GetNextWorkFlowGuidId(Guid currentWorkFlowGuideId, WeightId weightId);
    }
}
