using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FileManager.Domain.Services;
using FileManager.Infrastructure.Services;
using FileManager.WebUI.Middleware;
using FileManager.WebUI.OperationFilter;
using FileManager.Domain.Configs;
using FileManager.Infrastructure;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
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
        private readonly IWebHostEnvironment _env;

        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            _env = env;
        }

        public IConfiguration Configuration { get; }

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
                // Docker image may not ship XML docs; missing file used to crash every Upload (SwaggerGen lazy resolve).
                var xmlPath = Path.Combine(AppContext.BaseDirectory, "FileManager.WebUI.xml");
                if (File.Exists(xmlPath))
                    c.IncludeXmlComments(xmlPath);
                else
                    Console.WriteLine($"[FileManager] WARN swagger xml missing: {xmlPath}");
            });

            #region Identity Server Connection Configuration
            // Same clinic Bearer as Healan/UserManager (audience WorkFlowWebApi).
            // Authority is internal docker host; token iss is the public auth URL.
            var authority = Configuration["IdentityServer:Url"]?.Trim();
            if (_env.IsProduction()
                && (string.IsNullOrWhiteSpace(authority)
                    || authority.Contains("localhost", StringComparison.OrdinalIgnoreCase)))
            {
                Console.Error.WriteLine(
                    $"[FileManagerAuth] WARN IdentityServer:Url was '{authority}' — forcing http://identity-server:8080/");
                authority = "http://identity-server:8080/";
            }

            var validIssuer = Configuration["IdentityServer:ValidIssuer"]?.Trim()
                ?? "http://auth.drshahrooei.ir";

            Console.WriteLine(
                $"[FileManagerAuth] Configure Authority={authority} ValidIssuer={validIssuer} ApiName=WorkFlowWebApi Env={_env.EnvironmentName}");

            services.AddAuthentication("Bearer")
              .AddIdentityServerAuthentication("Bearer", options =>
              {
                  options.Authority = authority;
                  options.ApiName = "WorkFlowWebApi";
                  options.ApiSecret = "T$e.!R*WorkFlowWebApi*E@M@M@A@M";
                  options.RequireHttpsMetadata = false;
                  options.SaveToken = true;
                  options.JwtBearerEvents = new JwtBearerEvents
                  {
                      OnAuthenticationFailed = ctx =>
                      {
                          Console.Error.WriteLine($"[FileManagerAuth] FAIL {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                          return Task.CompletedTask;
                      },
                      OnTokenValidated = ctx =>
                      {
                          var sub = ctx.Principal?.FindFirst("sub")?.Value ?? "(none)";
                          Console.WriteLine($"[FileManagerAuth] OK sub={sub}");
                          return Task.CompletedTask;
                      },
                      OnChallenge = ctx =>
                      {
                          Console.Error.WriteLine($"[FileManagerAuth] Challenge error={ctx.Error} desc={ctx.ErrorDescription}");
                          return Task.CompletedTask;
                      },
                  };
              });

            // Accept public issuer on JWTs while Authority hostname is identity-server.
            services.PostConfigureAll<JwtBearerOptions>(opts =>
            {
                opts.TokenValidationParameters ??= new TokenValidationParameters();
                opts.TokenValidationParameters.ValidateIssuer = true;
                var issuers = new List<string>
                {
                    validIssuer,
                    validIssuer.TrimEnd('/') + "/",
                    "http://auth.drshahrooei.ir",
                    "http://auth.drshahrooei.ir/",
                    "https://auth.drshahrooei.ir",
                    "https://auth.drshahrooei.ir/",
                };
                if (!string.IsNullOrWhiteSpace(authority))
                {
                    issuers.Add(authority);
                    issuers.Add(authority.TrimEnd('/'));
                    issuers.Add(authority.TrimEnd('/') + "/");
                }
                opts.TokenValidationParameters.ValidIssuers = issuers
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();
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
            var configuredOrigins = (Configuration["ClientBaseUrl"] ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(o => !string.IsNullOrWhiteSpace(o));
            var defaultOrigins = new[]
            {
                "http://clinic.drshahrooei.ir",
                "https://clinic.drshahrooei.ir",
                "http://www.drshahrooei.ir",
                "https://www.drshahrooei.ir",
                "http://portal.drshahrooei.ir",
                "https://portal.drshahrooei.ir",
                "http://auth.drshahrooei.ir",
                "https://auth.drshahrooei.ir",
                "http://localhost:4200",
                "http://localhost:4201",
                "http://localhost:4202",
                "http://localhost:8081",
                "http://127.0.0.1:8081",
                "http://localhost:8082",
                "http://127.0.0.1:8082",
                "http://localhost:8083",
                "http://127.0.0.1:8083",
                "http://localhost:8084",
                "http://127.0.0.1:8084",
            };
            var origins = configuredOrigins
                .Concat(defaultOrigins)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            services.AddCors(options =>
            {
                options.AddPolicy("default",
                    builder => builder
                        .SetIsOriginAllowed(origin =>
                        {
                            if (string.IsNullOrWhiteSpace(origin)) return false;
                            if (origins.Contains(origin)) return true;
                            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                            var host = uri.Host.Trim('[', ']');
                            // Expo web (any port) on this machine
                            return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                                || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                                || host.Equals("::1", StringComparison.OrdinalIgnoreCase);
                        })
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .WithExposedHeaders("FileTitle"));
            });
            #endregion

            services.AddHostedService<HostedFileBackgroundService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // First in pipeline so every Upload hit/error appears in `docker logs`.
            app.UseMiddleware<UploadConsoleDiagnosticsMiddleware>();

            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "FileManager.WebUI v1"));
            app.UseStaticFiles();
            app.UseRouting();
            app.UseCors("default");
            app.UseIpRateLimiting();
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<SecurityHeaderMiddleware>();
            app.UseMiddleware<QueryValidationMiddleware>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
