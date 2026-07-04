using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Patients.Dtos;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Patients.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Orders.Dtos;
public class PrescriptionDrugDto:IMapFrom<PrescriptionDrug>
    {
        public long PrescriptionDrugId { get; set; }
        public long PrescriptionId { get; set; }
        public string DrugName { get; set; }
        public string Dosage { get; set; }
        public string UsageInstructions { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<PrescriptionDrug, PrescriptionDrugDto>();
    }
}
