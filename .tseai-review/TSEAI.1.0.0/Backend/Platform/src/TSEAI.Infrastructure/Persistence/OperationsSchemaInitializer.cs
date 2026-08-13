using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
namespace TSEAI.Infrastructure.Persistence;
public sealed class OperationsSchemaInitializer(IConfiguration configuration)
{
    public async Task InitializeAsync(CancellationToken ct=default)
    {
        var cs=configuration.GetConnectionString("ApplicationDb"); if(string.IsNullOrWhiteSpace(cs)) return;
        await using var c=new SqlConnection(cs); await c.OpenAsync(ct);
        var sql=@"IF OBJECT_ID('dbo.AuditEvents','U') IS NULL CREATE TABLE dbo.AuditEvents(
Id uniqueidentifier NOT NULL PRIMARY KEY,UserId uniqueidentifier NULL,Action nvarchar(120) NOT NULL,
ResourceType nvarchar(120) NOT NULL,ResourceId nvarchar(160) NULL,Outcome nvarchar(40) NOT NULL,
CorrelationId nvarchar(100) NOT NULL,MetadataJson nvarchar(max) NULL,CreatedAtUtc datetime2 NOT NULL);
IF OBJECT_ID('dbo.OperationalIncidents','U') IS NULL CREATE TABLE dbo.OperationalIncidents(
Id uniqueidentifier NOT NULL PRIMARY KEY,Component nvarchar(120) NOT NULL,Severity nvarchar(30) NOT NULL,
Code nvarchar(100) NOT NULL,Message nvarchar(1000) NOT NULL,Status nvarchar(30) NOT NULL,
FirstSeenUtc datetime2 NOT NULL,LastSeenUtc datetime2 NOT NULL,Occurrences int NOT NULL);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_AuditEvents_CreatedAtUtc') CREATE INDEX IX_AuditEvents_CreatedAtUtc ON dbo.AuditEvents(CreatedAtUtc DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_AuditEvents_Action_CreatedAtUtc') CREATE INDEX IX_AuditEvents_Action_CreatedAtUtc ON dbo.AuditEvents(Action,CreatedAtUtc DESC) INCLUDE(UserId,Outcome);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_OperationalIncidents_Status_LastSeen') CREATE INDEX IX_OperationalIncidents_Status_LastSeen ON dbo.OperationalIncidents(Status,LastSeenUtc DESC);";
        await using var cmd=new SqlCommand(sql,c); await cmd.ExecuteNonQueryAsync(ct);
    }
}
