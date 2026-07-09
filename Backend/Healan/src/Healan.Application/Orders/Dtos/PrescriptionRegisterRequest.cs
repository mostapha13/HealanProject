using Healan.Application.Common.Mappings;
using Healan.Domain.Orders.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Orders.Dtos;
    public class PrescriptionRegisterRequest : IMapFrom<Prescription>
    {
        public long PrescriptionId { get; set; }
        public long AppointmentId { get; set; }
        public DateTime IssueDate { get; set; }
        public string Notes { get; set; }
        public DateTime? NextAppointmentDate { get; set; }

        public ICollection<PrescriptionDrugDto> PrescriptionDrugs { get; set; }
        public ICollection<LabTestRequestDto> LabTestRequests { get; set; }
        public ICollection<ImagingRequestDto> ImagingRequests { get; set; }
        public EchoReportDto? EchoReport { get; set; }
    }
 
