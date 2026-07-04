using MediatR.Pipeline;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Behaviours
{
    public class LoggingBehaviour<TRequest> : IRequestPreProcessor<TRequest>
    {
        private readonly ILogger _logger;
        private readonly ICurrentUserService _currentUserService;

        public LoggingBehaviour(ILogger<TRequest> logger, ICurrentUserService currentUserService)
        {
            _logger = logger;
            _currentUserService = currentUserService;
        }

        public async Task Process(TRequest request, CancellationToken cancellationToken)
        {
            var requestName = typeof(TRequest).Name;
            var userId = _currentUserService.UserId;

            _logger.LogInformation("TSE Request: {Name} {@UserId} {@Request}",
                requestName, userId, request);
        }
    }
}
