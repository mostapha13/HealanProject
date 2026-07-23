using FluentValidation.AspNetCore;
using Healan.Application;
using Healan.Infrastructure;
using Healan.WebApi.OperationFilter;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Share.Domain.Constants;
using Share.Domain.Converters;
using Share.Application.Common.Filters;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Services;
using Share.Infrastructure;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure.Services;
using Share.MessageBroker.RabbitMQ;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json.Serialization;
using WorkFlow.Share;

namespace Healan.WebApi
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
            // Show auth failure details in docker logs (iss/aud/signature messages).
            IdentityModelEventSource.ShowPII = true;

            services.AddApplication(Configuration);
            services.AddInfrastructure(Configuration);

            services.AddChannelService();
            services.AddHttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddWorkFlowService(Configuration);
            services.AddDocumentService(Configuration);
            services.AddHtmlSanitizer();
            services.AddSmsServices();

            services.AddControllers(options =>
            {
                options.Filters.Add<ApiExceptionFilterAttribute>();
            })
                .AddFluentValidation(x => x.AutomaticValidationEnabled = false)
                .AddJsonOptions(opts =>
                {
                    opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                    opts.JsonSerializerOptions.Converters.Add(new NullableDateTimeJsonConverter());
                    opts.JsonSerializerOptions.Converters.Add(new NullableStringJsonConverter());
                });

            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.SuppressModelStateInvalidFilter = true;
            });

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Healan Clinic API", Version = "v1" });
                c.OperationFilter<SwaggerFileOperationFilter>();
                c.IncludeXmlComments("HealanDocument.xml");
            });

            // Docker Production MUST talk to identity-server on the compose network.
            // If appsettings.Production.json was overwritten (password-only restore), the baked-in
            // Development URL (https://localhost:44320) survives → IDX20804 and every JWT fails.
            var authority = Configuration["IdentityServer:Url"]?.Trim();
            if (_env.IsProduction()
                && (string.IsNullOrWhiteSpace(authority)
                    || authority.Contains("localhost", StringComparison.OrdinalIgnoreCase)))
            {
                Console.Error.WriteLine(
                    $"[HealanAuth] WARN IdentityServer:Url was '{authority}' — forcing http://identity-server:8080/ (fix docker/config/healan-webapi/appsettings.Production.json)");
                authority = "http://identity-server:8080/";
            }

            var validIssuer = Configuration["IdentityServer:ValidIssuer"]?.Trim()
                ?? "http://auth.drshahrooei.ir";

            Console.WriteLine(
                $"[HealanAuth] Configure Authority={authority} ValidIssuer={validIssuer} JwtBearer Env={_env.EnvironmentName} BuildTag=mobile-ropc-jwt-v1");

            // Prefer JWT validation (no introspection). Resource-owner password tokens from
            // HealanClinicMobile are JWTs whose aud set can omit WorkFlowWebApi depending on
            // IdentityServer scope expansion — ValidateAudience=false keeps clinic code-flow
            // and mobile ROPC working while still verifying issuer + signature.
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
            services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
              .AddJwtBearer("Bearer", options =>
               {
                   options.Authority = authority;
                   options.RequireHttpsMetadata = false;
                   options.TokenValidationParameters = new TokenValidationParameters
                   {
                       ValidateIssuer = true,
                       ValidIssuers = new[]
                       {
                           validIssuer,
                           "https://auth.drshahrooei.ir",
                           "http://auth.drshahrooei.ir",
                           "https://auth.drshahrooei.ir/",
                           "http://auth.drshahrooei.ir/",
                       },
                       ValidateAudience = false,
                       ValidateLifetime = true,
                       NameClaimType = "sub",
                       RoleClaimType = "role",
                   };
                   options.Events = new JwtBearerEvents
                   {
                       OnMessageReceived = ctx =>
                       {
                           Console.WriteLine($"[HealanAuth] MessageReceived path={ctx.Request.Path} hasAuthHeader={ctx.Request.Headers.ContainsKey("Authorization")}");
                           return Task.CompletedTask;
                       },
                       OnAuthenticationFailed = ctx =>
                       {
                           Console.Error.WriteLine($"[HealanAuth] FAIL type={ctx.Exception.GetType().Name} msg={ctx.Exception.Message}");
                           if (ctx.Exception.InnerException != null)
                               Console.Error.WriteLine($"[HealanAuth] FAIL inner={ctx.Exception.InnerException.Message}");
                           return Task.CompletedTask;
                       },
                       OnTokenValidated = ctx =>
                       {
                           var sub = ctx.Principal?.FindFirst("sub")?.Value
                               ?? ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? "(none)";
                           var claimTypes = string.Join(",", ctx.Principal?.Claims.Select(c => c.Type).Distinct().Take(15) ?? Array.Empty<string>());
                           Console.WriteLine($"[HealanAuth] OK sub={sub} claimTypes=[{claimTypes}]");
                           return Task.CompletedTask;
                       },
                       OnChallenge = ctx =>
                       {
                           Console.Error.WriteLine($"[HealanAuth] Challenge error={ctx.Error} desc={ctx.ErrorDescription} authFailure={ctx.AuthenticateFailure?.Message}");
                           return Task.CompletedTask;
                       }
                   };
               });

            services.AddAuthorization();

            services.AddCors(options =>
            {
                var configured = (Configuration["ClientBaseUrl"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(o => !string.IsNullOrWhiteSpace(o));
                var defaults = new[]
                {
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
                    "http://clinic.drshahrooei.ir",
                    "https://clinic.drshahrooei.ir",
                    "http://www.drshahrooei.ir",
                    "https://www.drshahrooei.ir",
                    "http://portal.drshahrooei.ir",
                    "https://portal.drshahrooei.ir",
                    "http://auth.drshahrooei.ir",
                    "https://auth.drshahrooei.ir",
                };
                var origins = configured
                    .Concat(defaults)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();
                options.AddPolicy("default", builder => builder
                    .WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            Console.WriteLine($"[HealanAuth] Pipeline start Env={env.EnvironmentName} IsDevelopment={env.IsDevelopment()}");

            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();
            else
                app.UseExceptionHandler("/Error");

            app.UseStaticFiles();
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Healan Clinic API v1"));

            app.UseRouting();
            app.UseCors("default");
            app.UseCookiePolicy();
            app.UseAuthentication();
            // Decode JWT iss/aud/sub even when auth fails — visible in docker logs as [AuthDiag]
            app.UseMiddleware<AuthDiagnosticsMiddleware>();
            // Must run after Authentication. (Local DEBUG builds skip checks inside AccessMiddleware.)
            app.UseMiddleware<AccessMiddleware>(HealanAccessFormIds.SystemName);
            app.UseAuthorization();
            app.UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
