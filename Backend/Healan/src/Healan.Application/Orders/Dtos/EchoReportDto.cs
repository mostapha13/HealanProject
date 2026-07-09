using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Orders.Entities;

namespace Healan.Application.Orders.Dtos;

public class EchoReportDto : IMapFrom<EchoReport>
{
    public long EchoReportId { get; set; }
    public long PrescriptionId { get; set; }
    public string? Phm { get; set; }

    public string? Rvid { get; set; }
    public string? Lvidd { get; set; }
    public string? Lvids { get; set; }
    public string? Ivsd { get; set; }
    public string? Pwd { get; set; }
    public string? Lvef { get; set; }
    public string? SimpsonEf { get; set; }
    public string? LvMass { get; set; }
    public string? Sm { get; set; }
    public string? TelIndex { get; set; }
    public string? AvAnnulus { get; set; }
    public string? SinusValsalva { get; set; }
    public string? StJunction { get; set; }
    public string? Acs { get; set; }
    public string? AscAo { get; set; }
    public string? LaArea { get; set; }
    public string? LaDia { get; set; }
    public string? LaVolume { get; set; }
    public string? Edv { get; set; }
    public string? Esv { get; set; }

    public string? Mve { get; set; }
    public string? Mva { get; set; }
    public string? Mvdt { get; set; }
    public string? Mvpht { get; set; }
    public string? MvMean { get; set; }
    public string? MvArea { get; set; }
    public string? MvAnnulus { get; set; }
    public string? PvsMax { get; set; }
    public string? PvdMax { get; set; }
    public string? DtiEm { get; set; }
    public string? DtiAm { get; set; }

    public string? AovMax { get; set; }
    public string? LvotVmax { get; set; }
    public string? LvotVti { get; set; }
    public string? AvVti { get; set; }
    public string? AoPeak { get; set; }
    public string? AoMean { get; set; }
    public string? Ava { get; set; }
    public string? At { get; set; }
    public string? AovMg { get; set; }
    public string? AovPg { get; set; }

    public string? TrgMax { get; set; }
    public string? Rvsp { get; set; }
    public string? Pap { get; set; }
    public string? TvMean { get; set; }
    public string? TvAnnulus { get; set; }
    public string? TvMg { get; set; }
    public string? TvPg { get; set; }
    public string? PvMax { get; set; }
    public string? PvPg { get; set; }
    public string? PvVti { get; set; }
    public string? RvotVti { get; set; }
    public string? Piphi { get; set; }
    public string? Ivc { get; set; }
    public string? RaArea { get; set; }

    public string? SeptalE { get; set; }
    public string? LateralE { get; set; }
    public string? SPrime { get; set; }
    public string? APrime { get; set; }

    public string? SmTdi { get; set; }
    public string? Tapsie { get; set; }

    public string? Conclusion { get; set; }
    public string? Recommendation { get; set; }

    public void Mapping(Profile profile)
    {
        profile.CreateMap<EchoReport, EchoReportDto>();
        profile.CreateMap<EchoReportDto, EchoReport>()
            .ForMember(d => d.EchoReportId, o => o.Ignore())
            .ForMember(d => d.PrescriptionId, o => o.Ignore())
            .ForMember(d => d.Prescription, o => o.Ignore());
    }
}
