using Share.Application.ContextMaps.Contents.Queries.DateProvider;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Application.Common.Interfaces
{
    public interface IDateProviderApi
    {
        Task<IsHolidayResponse> IsHoliday(IsHolidayRequest request, CancellationToken cancellationToken = default);
        Task<int> SubtractWorkingDate(SubtractWorkingDateRequest request, CancellationToken cancellationToken = default);
        Task<WorkingDateResponse> WorkingDate(WorkingDateRequest request, CancellationToken cancellationToken = default);

    }
}
