using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Share.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentValidation.AspNetCore;
using FluentValidation;
using Share.Domain.Models;
using Microsoft.Extensions.Options;
using System.Threading;
using Share.MessageBroker.RabbitMQ.Service;
using Share.MessageBroker.RabbitMQ.Implemention;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
using Share.Infrastructure.SecurityMiddlewares;
using Notification.Infrastructure;
using Notification.Application.Services;
using Share.MessageBroker.RabbitMQ;
using Notification.Application;
using Notification.WebApp.OperationFilter;
using System.Text.Json.Serialization;
namespace Notification.WebApp
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddApplication(Configuration);
            services.AddInfrastructure(Configuration);
            services.AddHtmlSanitizer();
            services.AddHttpContextAccessor();
            services.AddControllers().AddJsonOptions(opts =>
            {
                var enumConverter = new JsonStringEnumConverter();
                opts.JsonSerializerOptions.Converters.Add(enumConverter);
            }); ;
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Notification.WebApp", Version = "v1" });
                c.OperationFilter<SwaggerFileOperationFilter>();
            });


            #region Identity Server Connection Configuration
            var builder = services.AddAuthentication("Bearer")
             .AddIdentityServerAuthentication("Bearer", options =>
             {
                 options.Authority = Configuration["IdentityServer:Url"];
                 options.ApiName = "MarketMakerWebApi";
                 options.ApiSecret = "T$e.!R*MarketMakerWebApi*E@M@M@A@M";
                 options.RequireHttpsMetadata = false;
             });
            var origins = Configuration["ClientBaseUrl"].Split(",");
            services.AddCors(options =>
            {
                options.AddPolicy("default",
                builder => builder
                .WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());
            });
            #endregion



            services.AddHostedService<NotificationBackgroundService>();
            //services.AddMvc();


        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notification.WebApp v1"));
            app.UseHttpsRedirection();

            app.UseRouting();
            app.UseCors("default");
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<SecurityHeaderMiddleware>();
            app.UseMiddleware<QueryValidationMiddleware>();
            app.UseMiddleware<InputValidationMiddleware>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
