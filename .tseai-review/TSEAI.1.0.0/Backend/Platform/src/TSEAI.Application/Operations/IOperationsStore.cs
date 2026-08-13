namespace TSEAI.Application.Operations;
public interface IOperationsStore
{
    Task<OperationsOverview> OverviewAsync(CancellationToken ct);
    Task<IReadOnlyList<AuditItem>> AuditAsync(int take,CancellationToken ct);
    Task<IReadOnlyList<IncidentItem>> IncidentsAsync(string? status,int take,CancellationToken ct);
    Task RecordAuditAsync(Guid? userId,string action,string resourceType,string? resourceId,string outcome,string correlationId,string? metadataJson,CancellationToken ct);
    Task RecordIncidentAsync(string component,string severity,string code,string message,CancellationToken ct);
}
