using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using TSEAI.Application.Operations;

namespace TSEAI.Infrastructure.Operations;

public sealed class SqlOperationsStore(IConfiguration configuration) : IOperationsStore
{
    private string ConnectionString => configuration.GetConnectionString("ApplicationDb")
        ?? throw new InvalidOperationException("ApplicationDb missing");

    public async Task<OperationsOverview> OverviewAsync(CancellationToken ct)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        const string sql = """
            SELECT
              (SELECT COUNT_BIG(*) FROM dbo.AuditEvents WHERE Action='chat.ask' AND CreatedAtUtc>=CONVERT(date,SYSUTCDATETIME())),
              (SELECT COUNT_BIG(*) FROM dbo.AuditEvents WHERE Action='chat.ask' AND CreatedAtUtc>=DATEFROMPARTS(YEAR(SYSUTCDATETIME()),MONTH(SYSUTCDATETIME()),1)),
              (SELECT COUNT_BIG(DISTINCT UserId) FROM dbo.AuditEvents WHERE Action='chat.ask' AND UserId IS NOT NULL AND CreatedAtUtc>=CONVERT(date,SYSUTCDATETIME())),
              (SELECT COUNT_BIG(*) FROM dbo.SavedFilters WHERE IsDeleted=0),
              (SELECT COUNT_BIG(*) FROM dbo.AlertRules WHERE IsDeleted=0 AND IsEnabled=1),
              (SELECT COUNT_BIG(*) FROM dbo.OperationalIncidents WHERE Status='Open');
            SELECT Outcome,COUNT_BIG(*) FROM dbo.AuditEvents
              WHERE Action='chat.ask' AND Outcome<>'success' AND CreatedAtUtc>=DATEADD(day,-7,SYSUTCDATETIME())
              GROUP BY Outcome;
            """;
        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) throw new InvalidOperationException("Operations overview query returned no row.");
        var questionsToday = reader.GetInt64(0);
        var questionsThisMonth = reader.GetInt64(1);
        var activeUsersToday = reader.GetInt64(2);
        var savedFilters = reader.GetInt64(3);
        var enabledAlerts = reader.GetInt64(4);
        var openIncidents = reader.GetInt64(5);
        var failures = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        await reader.NextResultAsync(ct);
        while (await reader.ReadAsync(ct)) failures[reader.GetString(0)] = reader.GetInt64(1);
        return new OperationsOverview(
            questionsToday, questionsThisMonth, activeUsersToday, savedFilters,
            enabledAlerts, openIncidents, new Dictionary<string, long>(), failures);
    }

    public async Task<IReadOnlyList<AuditItem>> AuditAsync(int take, CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 500);
        var rows = new List<AuditItem>();
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(
            "SELECT TOP (@take) Id,UserId,Action,ResourceType,ResourceId,Outcome,CorrelationId,CreatedAtUtc FROM dbo.AuditEvents ORDER BY CreatedAtUtc DESC", connection);
        command.Parameters.Add("@take", System.Data.SqlDbType.Int).Value = take;
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            rows.Add(new AuditItem(
                reader.GetGuid(0), reader.IsDBNull(1) ? null : reader.GetGuid(1), reader.GetString(2),
                reader.GetString(3), reader.IsDBNull(4) ? null : reader.GetString(4), reader.GetString(5),
                reader.GetString(6), reader.GetDateTime(7)));
        return rows;
    }

    public async Task<IReadOnlyList<IncidentItem>> IncidentsAsync(string? status, int take, CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 500);
        var rows = new List<IncidentItem>();
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(
            "SELECT TOP (@take) Id,Component,Severity,Code,Message,Status,Occurrences,FirstSeenUtc,LastSeenUtc FROM dbo.OperationalIncidents WHERE (@status IS NULL OR Status=@status) ORDER BY LastSeenUtc DESC", connection);
        command.Parameters.Add("@take", System.Data.SqlDbType.Int).Value = take;
        command.Parameters.Add("@status", System.Data.SqlDbType.NVarChar, 30).Value = (object?)status ?? DBNull.Value;
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            rows.Add(new IncidentItem(
                reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
                reader.GetString(4), reader.GetString(5), reader.GetInt32(6), reader.GetDateTime(7), reader.GetDateTime(8)));
        return rows;
    }

    public async Task RecordAuditAsync(
        Guid? userId, string action, string resourceType, string? resourceId, string outcome,
        string correlationId, string? metadataJson, CancellationToken ct)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(
            "INSERT dbo.AuditEvents(Id,UserId,Action,ResourceType,ResourceId,Outcome,CorrelationId,MetadataJson,CreatedAtUtc) VALUES(NEWID(),@userId,@action,@resourceType,@resourceId,@outcome,@correlationId,@metadataJson,SYSUTCDATETIME())", connection);
        command.Parameters.Add("@userId", System.Data.SqlDbType.UniqueIdentifier).Value = (object?)userId ?? DBNull.Value;
        command.Parameters.Add("@action", System.Data.SqlDbType.NVarChar, 120).Value = action;
        command.Parameters.Add("@resourceType", System.Data.SqlDbType.NVarChar, 120).Value = resourceType;
        command.Parameters.Add("@resourceId", System.Data.SqlDbType.NVarChar, 160).Value = (object?)resourceId ?? DBNull.Value;
        command.Parameters.Add("@outcome", System.Data.SqlDbType.NVarChar, 40).Value = outcome;
        command.Parameters.Add("@correlationId", System.Data.SqlDbType.NVarChar, 100).Value = correlationId;
        command.Parameters.Add("@metadataJson", System.Data.SqlDbType.NVarChar, -1).Value = (object?)metadataJson ?? DBNull.Value;
        await command.ExecuteNonQueryAsync(ct);
    }

    public async Task RecordIncidentAsync(string component, string severity, string code, string message, CancellationToken ct)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        const string sql = """
            UPDATE dbo.OperationalIncidents WITH (UPDLOCK,SERIALIZABLE)
              SET LastSeenUtc=SYSUTCDATETIME(),Occurrences=Occurrences+1,Severity=@severity,Message=@message
              WHERE Component=@component AND Code=@code AND Status='Open';
            IF @@ROWCOUNT=0
              INSERT dbo.OperationalIncidents(Id,Component,Severity,Code,Message,Status,Occurrences,FirstSeenUtc,LastSeenUtc)
              VALUES(NEWID(),@component,@severity,@code,@message,'Open',1,SYSUTCDATETIME(),SYSUTCDATETIME());
            """;
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@component", System.Data.SqlDbType.NVarChar, 120).Value = component;
        command.Parameters.Add("@severity", System.Data.SqlDbType.NVarChar, 30).Value = severity;
        command.Parameters.Add("@code", System.Data.SqlDbType.NVarChar, 100).Value = code;
        command.Parameters.Add("@message", System.Data.SqlDbType.NVarChar, 1000).Value = message;
        await command.ExecuteNonQueryAsync(ct);
    }
}
