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

            // CRITICAL: use the SAME ApiName/ApiSecret as UserManagerAPI.
            // Clinic tokens are issued for Content_Producer; aud includes WorkFlowWebApi
            // (UserManager already accepts them). HealanWebApi alone fails if that
            // audience is missing from the JWT — which leaves silent 401 with no AccessMiddleware logs
            // because UseAuthorization Challenge short-circuits the pipeline.
            services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
              .AddIdentityServerAuthentication("Bearer", options =>
               {
                   options.Authority = Configuration["IdentityServer:Url"];
                   options.ApiName = "WorkFlowWebApi";
                   options.ApiSecret = "T$e.!R*WorkFlowWebApi*E@M@M@A@M";
                   options.RequireHttpsMetadata = false;
                   options.JwtBearerEvents = new JwtBearerEvents
                   {
                       OnMessageReceived = context =>
                       {
                           var hasBearer = context.Request.Headers.ContainsKey("Authorization");
                           Console.WriteLine($"[HealanAuth] MessageReceived path={context.Request.Path} hasBearer={hasBearer}");
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
                           var aud = string.Join("|", context.Principal?.FindAll("aud").Select(c => c.Value) ?? Array.Empty<string>());
                           Console.WriteLine($"[HealanAuth] OK sub={sub} aud={aud}");
                           return Task.CompletedTask;
                       },
                       OnChallenge = context =>
                       {
                           Console.Error.WriteLine($"[HealanAuth] Challenge error={context.Error} desc={context.ErrorDescription}");
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
                        "http://www.drshahrooei.ir",
                        "http://auth.drshahrooei.ir")
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
            // Before UseAuthorization so rejected JWT still hits AccessMiddleware (and our logs),
            // instead of an empty ASP.NET Challenge that leaves docker logs silent.
            app.UseMiddleware<AccessMiddleware>(HealanAccessFormIds.SystemName);
            app.UseAuthorization();
            app.UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
