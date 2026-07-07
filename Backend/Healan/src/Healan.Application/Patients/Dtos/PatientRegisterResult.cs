namespace Healan.Application.Patients.Dtos;

public record PatientRegisterResult(long Id, string? LoginUserName = null, string? InitialPassword = null);
