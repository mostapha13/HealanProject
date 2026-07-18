using Healan.Application.Common.Interfaces;
using Healan.Infrastructure.Context;
using Healan.Infrastructure.Booking;
using Healan.Infrastructure.Portal;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using Share.Infrastructure;
using Share.Infrastructure.Cache;
using Share.Infrastructure.Cache.Abstract;
using Share.Infrastructure.Services;
using System;
using WkHtmlToPdfDotNet;
using WkHtmlToPdfDotNet.Contracts;


namespace Healan.Infrastructure
{
    public static class DependencyInjection
    {
        public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
               options.UseSqlServer(
                   configuration.GetConnectionString("DefaultConnection"),
                   b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName))
               // Hand-written SQL migrations (no Designer) can trip EF9 PendingModelChangesWarning.
               .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
               );
            services.AddScoped<IApplicationDbContext, ApplicationDbContext>();


            services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
            services.AddScoped<IDocumentManagement, DocumentManagement>();

            services.AddScoped<Healan.Application.Portal.Services.IRagChatLogPublisher, RagChatLogPublisher>();
            services.AddScoped<Healan.Application.Portal.Services.IRagQuotaCounter, RagQuotaCounter>();
            services.AddSingleton<Healan.Application.Booking.Services.MemoryBookingOtpStore>();
            services.AddSingleton<Healan.Application.Booking.Services.IBookingOtpStore, DbBookingOtpStore>();
            services.AddHostedService<RagChatLogConsumerService>();
        }


    }
}