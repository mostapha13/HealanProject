using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Cache;
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Behaviours
{
    public class ConcurrentRequestSupervisorBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>, ICacheKeyGenerator
    {
        private static readonly ConcurrentDictionary<string, TaskCompletionSource<TResponse>> lockTable =
           new ConcurrentDictionary<string, TaskCompletionSource<TResponse>>();
        private readonly ILogger<ConcurrentRequestSupervisorBehaviour<TRequest, TResponse>> logger;
        private readonly IHttpContextAccessor httpContextAccessor;

        public ConcurrentRequestSupervisorBehaviour(ILogger<ConcurrentRequestSupervisorBehaviour<TRequest, TResponse>> logger, IHttpContextAccessor httpContextAccessor)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }

          public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            var requestUniqueKey = ((ICacheKeyGenerator)request).GetKey();
            var responseTcs = new TaskCompletionSource<TResponse>();
            TResponse response;

            logger.LogDebug($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Received");

            var dictTcs = lockTable.GetOrAdd(requestUniqueKey, responseTcs);

            if (dictTcs == responseTcs)
            {
                //request key does not exist in lock table
                logger.LogDebug($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Executing");

                try
                {
                    response = await next();

                    lockTable.TryRemove(requestUniqueKey, out _);

                    logger.LogDebug($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Dispatching response");
                    responseTcs.SetResult(response);
                }
                catch (TaskCanceledException)
                {
                    lockTable.TryRemove(requestUniqueKey, out _);

                    logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Task cancelled. Do not pass cancellation token to mediatR");

                    try
                    {
                        logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Try to request again.");
                        response = await next();
                    }
                    catch (TaskCanceledException)
                    {
                        logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Task cancelled again. Dispatching task cancelled");
                        responseTcs.SetCanceled();
                        throw;
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Request again cause exception. {ex.Message}");
                        lockTable.TryRemove(requestUniqueKey, out _);
                        responseTcs.SetException(ex);
                        throw;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Exception. Dispatching exception. {ex.Message}");

                    lockTable.TryRemove(requestUniqueKey, out _);
                    responseTcs.SetException(ex);
                    throw;
                }
            }
            else
            {
                //request already in progress. Wait for its response
                logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Waiting");
                response = await dictTcs.Task;
                logger.LogWarning($"Request[id:{requestUniqueKey}, trace:{httpContextAccessor.HttpContext?.TraceIdentifier ?? "N/A"}] Got Response");
            }

            return response;
        }
    }
}