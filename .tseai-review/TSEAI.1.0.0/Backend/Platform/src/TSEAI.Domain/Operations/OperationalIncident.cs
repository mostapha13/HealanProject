namespace TSEAI.Domain.Operations;
public sealed class OperationalIncident
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Component { get; set; } = "";
    public string Severity { get; set; } = "Warning";
    public string Code { get; set; } = "";
    public string Message { get; set; } = "";
    public string Status { get; set; } = "Open";
    public DateTime FirstSeenUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenUtc { get; set; } = DateTime.UtcNow;
    public int Occurrences { get; set; } = 1;
}
