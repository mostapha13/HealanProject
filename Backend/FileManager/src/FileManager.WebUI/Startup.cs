using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FileManager.Infrastructure.Persistence;
using FileManager.Domain.Services;
using FileManager.Infrastructure.Services;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
using FileManager.WebUI.OperationFilter;
using FileManager.Domain.Configs;
using FileManager.Infrastructure;
using System.Text.Json.Serialization;
using FluentValidation.AspNetCore;
using Share.MessageBroker.RabbitMQ;
using FileManager.WebUI.HostedService;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure;
using Microsoft.IdentityModel.Logging;
using AspNetCoreRateLimit;
using FileManager.Domain.Services.Signatures;
using FileManager.Infrastructure.Services.Signatures;
using Share.Application.Common.Filters;

namespace FileManager.WebUI
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
            IdentityModelEventSource.ShowPII = true;
          
            services.Configure<UploadFileConfig>(Configuration.GetSection("UploadFileConfig"));
            services.Configure<GatewayInfoConfig>(Configuration.GetSection("ApiGateway"));
            services.Configure<IpRateLimitOptions>(options =>
            {
                options.EnableEndpointRateLimiting = true;
                options.StackBlockedRequests = false;
                options.HttpStatusCode = 429;
                options.RealIpHeader = "X-Real-IP";
                options.ClientIdHeader = "X-ClientId";
                options.GeneralRules = new List<RateLimitRule>
        {
            new RateLimitRule
            {
                Endpoint = "GET:/File/Download/*",
                Period = "20s",
                Limit = 20,
            },
            new RateLimitRule
            {
                Endpoint = "GET:/File/DownloadAll/*",
                Period = "20s",
                Limit = 5,
            },
            new RateLimitRule
            {
                Endpoint = "POST:/File/Upload",
                Period = "20s",
                Limit = 20,
            },
                     new RateLimitRule
            {
                Endpoint = "POST:/File/EncryptedUpload",
                Period = "20s",
                Limit = 3,
            }
        };
            });
            services.AddMemoryCache();
            services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
            services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
            services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
            services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
            services.AddInMemoryRateLimiting();
            services.AddInfrastructure(Configuration);
            services.AddChannelService();
            services.AddHttpContextAccessor();
            services.AddHtmlSanitizer();
            services.AddControllers(options =>
          options.Filters.Add<ApiExceptionFilterAttribute>())
              .AddFluentValidation(x => x.AutomaticValidationEnabled = true)
              .AddJsonOptions(opts =>
              {
                  var enumConverter = new JsonStringEnumConverter();
                  opts.JsonSerializerOptions.Converters.Add(enumConverter);
              });
            services.AddFileAccessStatusServices(Configuration);
            services.AddLoginProviderServices(Configuration);
            services.AddScoped<ILinkMaker, LinkMaker>();
            services.AddTransient<IMalwareDitector, AMSIMalwareDitector>();
            services.AddScoped<IFileManager, FileManagerSerive>();
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<IDateTime, DateTimeService>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            services.AddScoped<ISignatureService, SignatureService>();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "FileManager.WebUI", Version = "v1" });
                c.OperationFilter<SwaggerFileOperationFilter>();
                c.IncludeXmlComments("FileManager.WebUI.xml");

            });


            #region Identity Server Connection Configuration
            var builder = services.AddAuthentication("Bearer")
              .AddIdentityServerAuthentication("Bearer", options =>
              {
                  options.Authority = Configuration["IdentityServer:Url"];
                  options.ApiName = "FileManagerWebApi";
                  options.ApiSecret = "T$e.!R*FileManagerWebApi*E@M@M@A@M";
                  options.RequireHttpsMetadata = false;
                  options.SaveToken=true;
              });


            services.AddAuthorization(options =>
            {
                options.AddPolicy("ApiScope", policy =>
                {
                    policy.RequireAuthenticatedUser();
                    policy.RequireClaim("scope", "Content_Producer");
                    policy.RequireClaim("scope", "openid");
                    policy.RequireClaim("scope", "profile");
                });
            });
            var origins = Configuration["ClientBaseUrl"].Split(",");
            services.AddCors(options =>
            {
                options.AddPolicy("default",
                builder => builder
                .WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                //.SetIsOriginAllowed((host) => true)
                .WithExposedHeaders("FileTitle")
                );
            });
            #endregion


            services.AddHostedService<HostedFileBackgroundService>();

        
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "FileManager.WebUI v1"));
            app.UseStaticFiles();
            //app.UseHsts();
            //app.UseHttpsRedirection();
            app.UseRouting();
            app.UseCors("default");
            app.UseIpRateLimiting();
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<SecurityHeaderMiddleware>();
            app.UseMiddleware<QueryValidationMiddleware>();
            //app.UseMiddleware<InputValidationMiddleware>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
