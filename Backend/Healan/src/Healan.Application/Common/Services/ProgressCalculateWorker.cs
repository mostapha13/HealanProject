//using MediatR;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.DependencyInjection;
//using Microsoft.Extensions.Hosting;
//using Share.Application.Common.Interfaces;

//namespace Healan.Application.Common.Services;
//public class ProgressCalculateWorker : BackgroundService
//{
//    private readonly IServiceProvider _serviceProvider;
//    private readonly IInMemoryQueue<DossierDataRequest> _queue;
//    private readonly IConfiguration _configuration;

//    public ProgressCalculateWorker(IServiceProvider serviceProvider, IInMemoryQueue<DossierDataRequest> queue, IConfiguration configuration)
//    {
//        _serviceProvider = serviceProvider;
//        _queue = queue;
//        _configuration = configuration;
//    }

//    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//    {
//        while (!stoppingToken.IsCancellationRequested)
//        {
//            using var scope = _serviceProvider.CreateScope();
//            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
//            while (_queue.TryDequeue(out var item))
//            {
//                await mediator.Send(new ProgressCalculateCommand() { DossierId = item.DossierId, SubmenuId = item.SubmenuId });
//            }
//            if (!int.TryParse(_configuration["DossierCalculateTime"], out int dossierTime))
//            {
//                dossierTime = 60;
//            }


//            await Task.Delay(TimeSpan.FromSeconds(dossierTime), stoppingToken);
//        }
//    }
//}

