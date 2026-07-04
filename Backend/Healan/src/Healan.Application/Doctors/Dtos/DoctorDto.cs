using AutoMapper;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Doctors.Enums;
using Share.Domain.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Doctors.Dtos;
    public class DoctorDto:IMapFrom<Doctor>
    {

    public long DoctorId { get; set; }
    public long UserId { get; set; }
    public long CompanyId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string? PersonnelNumber { get; set; }
    public string Mobile { get; set; }
    public DateTime? Birthdate { get; set; }
    public int MedicalSystemNumber { get; set; }
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }
    public string MedicalGroupTypeName { get; set; }
    public void Mapping(Profile profile)
    {

        profile.CreateMap<Doctor, DoctorDto>()
            .ForMember(a => a.MedicalGroupTypeName, b => b.MapFrom(c => c.MedicalGroupTypeId.GetDisplayName()));
    }
}

