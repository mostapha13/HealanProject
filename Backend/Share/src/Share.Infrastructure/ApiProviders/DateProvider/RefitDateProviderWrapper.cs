using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Application.ContextMaps.Contents.Queries.DateProvider;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.DateProvider
{
    public class RefitDateProviderWrapper : IDateProviderApi
    {
        private readonly ILogger<RefitDateProviderWrapper> logger;
        private readonly IRefitDateProvider api;
        private readonly IMemoryCache _memoryCache;
        public RefitDateProviderWrapper(ILogger<RefitDateProviderWrapper> logger, IRefitDateProvider api, IMemoryCache memoryCache)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.api = api ?? throw new ArgumentNullException(nameof(api));
            _memoryCache = memoryCache;
        }

        public async Task<IsHolidayResponse> IsHoliday(IsHolidayRequest request, CancellationToken cancellationToken = default)
        {
            string key = nameof(IsHolidayRequest) + request.BaseDateTime?.ToString("yyyyMMdd");
            IsHolidayResponse res = null;
            if (_memoryCache.TryGetValue(key, out res))
                return res;

            res = await api.IsHoliday(request, cancellationToken);
            _memoryCache.Set(key, res);
            return res;
        }

        public async Task<int> SubtractWorkingDate(SubtractWorkingDateRequest request, CancellationToken cancellationToken = default)
        {
            //string key = nameof(IsHolidayRequest) + request.BaseDateTime?.ToString("yyyyMMdd");
            int result = 0;
            //if (_memoryCache.TryGetValue(key, out res))
            //    return res;

            result = await api.SubtractWorkingDate(request, cancellationToken);
            //_memoryCache.Set(key, res);
            return result;
        }

        public async Task<WorkingDateResponse> WorkingDate(WorkingDateRequest request, CancellationToken cancellationToken = default)
        {
            var result = await api.WorkingDate(request, cancellationToken);
            return result;
        }
    }
}
