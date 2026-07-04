using Refit;
using Share.Application.ContextMaps.Contents.Queries.DateProvider;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.DateProvider
{
    public interface IRefitDateProvider
    {
        [Get("/DateProvider/api/v1/DateTime/IsHoliday/fa")]
        Task<IsHolidayResponse> IsHoliday(IsHolidayRequest request, CancellationToken cancellationToken = default);


        [Get("/DateProvider/api/v1/DateTime/SubtractWorkingDate/fa")]
        Task<int> SubtractWorkingDate(SubtractWorkingDateRequest request, CancellationToken cancellationToken = default);

        [Get("/DateProvider/api/v1/DateTime/WorkingDate/fa")]
        Task<WorkingDateResponse> WorkingDate(WorkingDateRequest request, CancellationToken cancellationToken = default);
    }

}