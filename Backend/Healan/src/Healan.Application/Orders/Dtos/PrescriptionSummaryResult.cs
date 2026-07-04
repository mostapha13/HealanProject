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
    public class PrescriptionSummaryResult:IMapFrom<Prescription>
    {
        public long PrescriptionId { get; set; }
        public long AppointmentId { get; set; }
        public DateTime IssueDate { get; set; }
        public string Notes { get; set; }
        public DateTime? NextAppointmentDate { get; set; }

        public ICollection<PrescriptionDrugDto> PrescriptionDrugs { get; set; }
        public ICollection<LabTestRequestDto> LabTestRequests { get; set; }
        public ICollection<ImagingRequestDto> ImagingRequests { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Prescription, PrescriptionSummaryResult>()
                        .ForMember(a => a.PrescriptionDrugs, b => b.MapFrom(c => c.PrescriptionDrugs))
                        .ForMember(a => a.LabTestRequests, b => b.MapFrom(c => c.LabTestRequests))
                        .ForMember(a => a.ImagingRequests, b => b.MapFrom(c => c.ImagingRequests))
                        ;

      
    }

}

