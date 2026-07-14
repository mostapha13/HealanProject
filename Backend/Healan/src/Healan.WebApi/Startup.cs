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
            IdentityModelEventSource.ShowPII = true;

            // Match UserManagerAPI: do NOT clear inbound claim map
            // (sub is remapped to NameIdentifier; CurrentUserService reads both).

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

            var allowAnonymousDev = _env.IsDevelopment() &&
                Configuration.GetValue<bool>("Healan:AllowAnonymousInDevelopment");

            // Same working pattern as UserManagerAPI in production.
            services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
              .AddIdentityServerAuthentication("Bearer", options =>
               {
                   // Match UserManagerAPI exactly (proven working on this stack).
                   options.Authority = Configuration["IdentityServer:Url"];
                   options.ApiName = "HealanWebApi";
                   options.ApiSecret = "T$e.!R*HealanWebApi*E@M@M@A@M";
                   options.RequireHttpsMetadata = false;
               });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("HealanApi", policy =>
                {
                    if (allowAnonymousDev)
                        policy.RequireAssertion(_ => true);
                    else
                    {
                        policy.RequireAuthenticatedUser();
                        policy.RequireClaim("scope", "Content_Producer");
                    }
                });
            });

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
            app.UseAuthorization();
            app.UseMiddleware<AccessMiddleware>(HealanAccessFormIds.SystemName);
            app.UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
