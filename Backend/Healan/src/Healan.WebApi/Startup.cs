using FluentValidation.AspNetCore;
using Healan.Application;
using Healan.Infrastructure;
using Healan.WebApi.OperationFilter;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Logging;
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

            var authority = Configuration["IdentityServer:Url"];
            Console.WriteLine($"[HealanAuth] Configure IdentityServerAuthentication Authority={authority} ApiName=WorkFlowWebApi (same as UserManagerAPI) Env={_env.EnvironmentName}");

            // EXACT copy of IdentityServer.UserManagerAPI production auth — the only proven path
            // for these clinic tokens on this Docker stack. Do NOT use custom JwtBearer here:
            // Authority hostname (identity-server) vs token iss (auth.drshahrooei.ir) breaks JwtBearer
            // issuer validation differently than IdentityServerAuthentication.
            //
            // ApiName = WorkFlowWebApi because UserManager already accepts the same Bearer token
            // with that audience; HealanWebApi is often missing from JWT aud when Content_Producer
            // is requested unless identity-server was rebuilt with that ApiResource.
            services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
              .AddIdentityServerAuthentication("Bearer", options =>
               {
                   options.Authority = authority;
                   options.ApiName = "WorkFlowWebApi";
                   options.ApiSecret = "T$e.!R*WorkFlowWebApi*E@M@M@A@M";
                   options.RequireHttpsMetadata = false;
                   options.JwtBearerEvents = new JwtBearerEvents
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
