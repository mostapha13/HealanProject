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
using System.Security.Claims;
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
            IdentityModelEventSource.ShowPII = true;
            // Keep JWT "sub" readable as "sub" (not remapped away before CurrentUserService).
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

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

            // Authority = internal Identity (Docker DNS). Issuer on tokens = public auth host.
            var authority = (Configuration["IdentityServer:Url"] ?? "http://identity-server:8080/").TrimEnd('/') + "/";
            var validIssuer = (Configuration["IdentityServer:ValidIssuer"]
                ?? "http://auth.drshahrooei.ir").TrimEnd('/');

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
              .AddJwtBearer(options =>
              {
                  options.Authority = authority;
                  options.RequireHttpsMetadata = false;
                  options.SaveToken = true;

                  options.TokenValidationParameters = new TokenValidationParameters
                  {
                      ValidateIssuer = true,
                      ValidIssuers = new[]
                      {
                          validIssuer,
                          "http://auth.drshahrooei.ir",
                          "https://auth.drshahrooei.ir",
                          authority.TrimEnd('/'),
                      },
                      // Same clinic tokens work for UserManager (WorkFlowWebApi audience).
                      // Do not reject Healan because aud list omits HealanWebApi.
                      ValidateAudience = false,
                      ValidateLifetime = true,
                      NameClaimType = "sub",
                      RoleClaimType = "role",
                  };

                  options.Events = new JwtBearerEvents
                  {
                      OnMessageReceived = context =>
                      {
                          Console.WriteLine(
                              $"[HealanAuth] MessageReceived path={context.Request.Path} hasBearer={context.Request.Headers.ContainsKey("Authorization")}");
                          return Task.CompletedTask;
                      },
                      OnAuthenticationFailed = context =>
                      {
                          Console.Error.WriteLine($"[HealanAuth] FAIL: {context.Exception}");
                          return Task.CompletedTask;
                      },
                      OnTokenValidated = context =>
                      {
                          var sub = context.Principal?.FindFirst("sub")?.Value
                              ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? "(none)";
                          Console.WriteLine($"[HealanAuth] OK sub={sub}");
                          return Task.CompletedTask;
                      },
                      OnChallenge = context =>
                      {
                          Console.Error.WriteLine(
                              $"[HealanAuth] Challenge error={context.Error} desc={context.ErrorDescription}");
                          return Task.CompletedTask;
                      }
                  };
              });

            services.AddAuthorization();

            services.AddCors(options =>
            {
                options.AddPolicy("default", builder => builder
                    .WithOrigins(
                        Configuration["ClientBaseUrl"] ?? "http://localhost:4201",
                        "http://localhost:4200",
                        "http://localhost:4201",
                        "http://localhost:4202",
                        "http://clinic.drshahrooei.ir",
                        "https://clinic.drshahrooei.ir",
                        "http://www.drshahrooei.ir",
                        "https://www.drshahrooei.ir",
                        "http://auth.drshahrooei.ir",
                        "https://auth.drshahrooei.ir")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
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
            // Before Authorization so failed JWT still hits AccessMiddleware (visible logs).
            app.UseMiddleware<AccessMiddleware>(HealanAccessFormIds.SystemName);
            app.UseAuthorization();
            app.UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
