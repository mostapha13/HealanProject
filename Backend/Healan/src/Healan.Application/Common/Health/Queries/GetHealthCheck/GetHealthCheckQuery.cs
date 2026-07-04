//using IdentityServer.GrpcClient.Interfaces;
//using Healan.Application.Common.Health.Dtos;
//using Healan.Application.Common.Interfaces;
//using MediatR;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Logging;

//namespace Healan.Application.Common.Health.Queries.GetHealthCheck;
//public class GetHealthCheckQuery : IRequest<HealthCheckResultDto>
//{
//}


//public class GetHealthCheckQueryHandler : IRequestHandler<GetHealthCheckQuery, HealthCheckResultDto>
//{
//    private readonly IApplicationDbContext _dbContext;
//    private readonly IIdentityTool _identityTool;
//    private readonly ILogger<GetHealthCheckQueryHandler> _logger;

//    public GetHealthCheckQueryHandler(IApplicationDbContext dbContext, IIdentityTool identityTool, ILogger<GetHealthCheckQueryHandler> logger)
//    {
//        _dbContext = dbContext;
//        _identityTool = identityTool;
//        _logger = logger;
//    }

//    public async Task<HealthCheckResultDto> Handle(GetHealthCheckQuery request, CancellationToken cancellationToken)
//    {
//        var result = new HealthCheckResultDto();

//        try
//        {
//            result.DatabaseHealthy = await _dbContext.Users.AnyAsync(cancellationToken); // یا DbContext.Database.CanConnectAsync()
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Database health check failed.");
//            result.DatabaseHealthy = false;
//            result.ErrorMessage = "Database check failed";
//        }

//        try
//        {
//            var roles = await _identityTool.GetAllRole(new IdentityServer.GrpcClient.Empty());
//            result.IdentityGrpcHealthy = roles != null && roles.RoleInfos_.Any();
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "gRPC health check failed.");
//            result.IdentityGrpcHealthy = false;
//            result.ErrorMessage += " | gRPC check failed";
//        }

//        return result;
//    }
//}