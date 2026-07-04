using AutoMapper;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Patients.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Patients.Dtos;
    public class PatientDto:IMapFrom<Patient>
    {
    public long PatientId { get; set; }
    public long UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? Birthdate { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Patient, PatientDto>();
    }
}

