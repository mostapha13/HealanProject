using FluentValidation.AspNetCore;
using IdentityServer.Application;
using IdentityServer.Domain;
using IdentityServer.GrpcClient;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Share.Application.Common.Filters;
using Share.Application.Common.Interfaces;
using Share.Domain.Constants;
using Share.Infrastructure;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure.Services;
using Share.MessageBroker.RabbitMQ;
using System.Text.Json.Serialization;

namespace IdentityServer.UserManagerAPI
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
            services.AddRedisCache(Configuration);
            services.AddUserContext(Configuration);
            services.AddChannelService();
            services.AddHttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddDatabaseDeveloperPageExceptionFilter();
            services.AddMemoryCache();
            services.AddHtmlSanitizer();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddDocumentService(Configuration);
            services.AddScoped<ICaptchaProviderService, CaptchaProviderService>();
            services.AddTransient<ISmsApiService, SmsApiService>();
            services.AddLoginProviderServices(Configuration);
            services.AddSingleton<ISecurityService, SecurityService>();
            services.AddIdentityServices(Configuration);
            services.AddControllers(options =>
            options.Filters.Add<ApiExceptionFilterAttribute>())
                .AddFluentValidation(x => x.AutomaticValidationEnabled = true)
                .AddJsonOptions(opts =>
                {
                    var enumConverter = new JsonStringEnumConverter();
                    opts.JsonSerializerOptions.Converters.Add(enumConverter);
                });


            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.SuppressModelStateInvalidFilter = true;
            });

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "UserManagerApi", Version = "v1" });
            });


            #region Identity Server Connection Configuration
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
             });


            services.AddAuthorization(options =>
            {
                options.AddPolicy("ApiScope", policy =>
                {
                    policy.RequireAuthenticatedUser();

                    policy.RequireClaim("scope", "Content_Producer");
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
                //.WithExposedHeaders("FileTitle")
                );
            });

            #endregion

        }


        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.Use(async (ctx, next) =>
            {
                await next();
                // your code here runs after idsvr
            });
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseMigrationsEndPoint();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                // app.UseHsts(); /?
            }


            //app.UseCookiePolicy(new CookiePolicyOptions
            //{
            //    MinimumSameSitePolicy = SameSiteMode.Lax
            //});

            //app.UseHealthChecks("/health");
            //app.UseHttpsRedirection();

            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "UserManagerApi v1"));
            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors("default");
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseMiddleware<ImpersonationMutationGuardMiddleware>();
            app.UseAuthorization();
            //app.UseHttpsRedirection();
            //app.UseRequestResponseLogging();
            app.UseMiddleware<SecurityHeaderMiddleware>();
            //app.UseMiddleware<QueryValidationMiddleware>();
            app.UseMiddleware<InputValidationMiddleware>();
            //app.UseRequestResponseLogging();
            app.UseMiddleware<AccessMiddleware>(HealanAccessFormIds.SystemName);
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
