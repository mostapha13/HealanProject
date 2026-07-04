using FileManager.GrpcClient.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Health;
public class FileManagerHealthCheck : IHealthCheck
{
    private readonly IFileManagerTool _fileManagerTool;

    public FileManagerHealthCheck(IFileManagerTool fileManagerTool)
    {
        _fileManagerTool = fileManagerTool;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var fileInfo = await _fileManagerTool.GetFileReplyInfo(new Guid("AC88CC82-71E5-44EB-8CD8-09BC06E50A7C"));

            return !string.IsNullOrEmpty(fileInfo.FileName)
                ? HealthCheckResult.Healthy("FileManager is healthy")
                : HealthCheckResult.Unhealthy("FileManager is not healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("FileManager threw exception", ex);
        }
    }
}