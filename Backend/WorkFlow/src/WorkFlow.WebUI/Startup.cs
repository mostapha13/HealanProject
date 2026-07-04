using WorkFlow.Application;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Infrastructure;
using WorkFlow.Infrastructure.Persistence;
using WorkFlow.WebUI.OperationFilter;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Share.Infrastructure.Logging;
using Share.MessageBroker.RabbitMQ;
using System.Text.Json.Serialization;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
using System;
using System.Linq;
using System.Reflection;
using Share.Application.Common.Authorization;
using WorkFlow.WebUI.Controllers;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Services;
using Microsoft.AspNetCore.Identity;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure;
using Share.Application.Common.Filters;

namespace WorkFlow.WebUI
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
            services.AddChannelService();
            services.AddHttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddDatabaseDeveloperPageExceptionFilter();
            services.AddMemoryCache();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddDocumentService(Configuration);
            services.AddHtmlSanitizer();
     
            services.AddScoped<IWorkFlowGuidService, WorkFlowGuidService>();

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
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "WorkFlowApi", Version = "v1" });
                c.OperationFilter<SwaggerFileOperationFilter>();
                //c.IncludeXmlComments("WorkFlow.WebUI.xml");
            });

            #region Cache config
            var cacheType = Configuration["Cache:Type"];

            switch (cacheType?.ToLower())
            {
                case "hybrid":
                    services.AddHybridCache(Configuration);
                    break;

                case "local":
                    services.AddLocalCache(Configuration);
                    break;

                case "distributed":
                    services.AddDistributedCache(Configuration);
                    break;

                default: //no-cache
                    services.AddNoCache(Configuration);
                    break;
            }
            #endregion

            #region Identity Server Connection Configuration
            var builder = services.AddAuthentication("Bearer")
              .AddIdentityServerAuthentication("Bearer", options =>
               {
                   options.Authority = Configuration["IdentityServer:Url"];
                   options.ApiName = "WorkFlowWebApi";
                   options.ApiSecret = "T$e.!R*WorkFlowWebApi*E@M@M@A@M";
                   options.RequireHttpsMetadata = false;
               });




            //services.AddAuthorization(options =>
            //{
            //    options.AddPolicy("ApiScope", policy =>
            //    {
            //        policy.RequireAuthenticatedUser();
            //        policy.RequireClaim("scope", "WorkFlow");
            //    });
            //});
            services.AddCors(options =>
            {
                options.AddPolicy("default",
                builder => builder
                .WithOrigins(Configuration["ClientBaseUrl"])
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetIsOriginAllowed((host) => true)
                .WithExposedHeaders("FileTitle"));
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
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "WorkFlowApi v1"));
            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors("default");
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();
            //app.UseHttpsRedirection();
            //app.UseRequestResponseLogging();
            app.UseMiddleware<SecurityHeaderMiddleware>();
            //app.UseMiddleware<QueryValidationMiddleware>();
            app.UseMiddleware<InputValidationMiddleware>();
            //app.UseRequestResponseLogging();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
