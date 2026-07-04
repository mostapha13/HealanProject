using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.MedicalFeeServices.Dtos;
    public class MedicalFeeServiceRegisterRequest
    {
    public long MedicalFeeServiceId { get; set; }
    public long ServiceTypeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public long Price { get; set; }
}
