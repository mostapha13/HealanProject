//using MediatR;
//using Microsoft.Extensions.Diagnostics.HealthChecks;

//namespace Healan.Application.Health.Queries.GetAppHealth;
//public class GetAppHealthQuery : IRequest<HealthCheckResult>
//{
//}

//public class GetAppHealthQueryHandler : IRequestHandler<GetAppHealthQuery, HealthCheckResult>
//{
//    public async Task<HealthCheckResult> Handle(GetAppHealthQuery request, CancellationToken cancellationToken)
//    {
//        bool ok = true;
//        return ok
//            ? HealthCheckResult.Healthy("App is healthy.")
//            : HealthCheckResult.Unhealthy("App is not healthy.");
//    }
//}
