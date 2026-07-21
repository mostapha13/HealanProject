using IdentityServer.Application;
using IdentityServer.CustomTokenProvider;
using IdentityServer.Domain;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Share.Application.Common.Interfaces;
using Share.Infrastructure;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure.Services;
using System.Net;

namespace IdentityServer
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
            //IdentityModelEventSource.ShowPII = true;
            services.AddHttpContextAccessor();
            services.AddMemoryCache();
            services.AddRedisCache(Configuration);
            services.AddUserContext(Configuration);
            services.AddApplication(Configuration);
            services.AddHtmlSanitizer();
            services.AddMvc();

            // services.AddPolicyService(Configuration);
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<ICaptchaProviderService, CaptchaProviderService>();
            services.AddTransient<ISmsApiService, SmsApiService>();
            services.AddLoginProviderServices(Configuration);
            services.AddSingleton<ISecurityService, SecurityService>();


            ServicePointManager.ServerCertificateValidationCallback += (sender, certificate, chain, sslPolicyErrors) => true;


            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.KnownProxies.Add(IPAddress.Parse("172.18.0.1"));
            });

            //_ = services.Configure<ForwardedHeadersOptions>(options => options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

            services.AddControllers();
            //    options =>
            //options.Filters.Add<ApiExceptionFilterAttribute>())
            //    .AddFluentValidation(x => x.AutomaticValidationEnabled = true)
            //    .AddJsonOptions(opts =>
            //    {
            //        var enumConverter = new JsonStringEnumConverter();
            //        opts.JsonSerializerOptions.Converters.Add(enumConverter);
            //    });



            services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.SignIn.RequireConfirmedAccount = false;
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
            }
            )
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddTokenProvider("CustomPhone", typeof(CustomPhoneNumberTokenProvider<ApplicationUser>))
                .AddTokenProvider("CustomEmail", typeof(CustomEmailTokenProvider<ApplicationUser>));

            services.Configure<IdentityOptions>(options =>
            {
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
            });
            var builder = services.AddIdentityServer(options =>
            {
                options.IssuerUri = Configuration["IssuerUri"];
            })
                  .AddInMemoryPersistedGrants()
                  .AddInMemoryIdentityResources(Config.IdentityResources)
                  .AddInMemoryApiResources(Config.ApiResources)
                  .AddInMemoryApiScopes(Config.ApiScopes)
                  .AddInMemoryClients(Config.GetClients(Configuration))
                  .AddDeveloperSigningCredential()
                  .AddAspNetIdentity<ApplicationUser>()
                  .AddExtensionGrantValidator<ImpersonationGrantValidator>();


            services.AddTransient<IEmailSender, EmailSender>();


            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "IdentityServerWebApi", Version = "v1" });
            });

            var origins = Configuration["IdentityServer:AllowedCorsOrigins"].Split(",");
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



        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");

            }
            if (bool.Parse(Configuration["IsDevMode"]))
            {
                app.UseCookiePolicy(new CookiePolicyOptions
                {
                    MinimumSameSitePolicy = SameSiteMode.Lax,
                    Secure = CookieSecurePolicy.SameAsRequest,
                    HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always
                });
            }
            else
            {
                app.UseHsts();
                app.UseCookiePolicy(new CookiePolicyOptions
                {
                    MinimumSameSitePolicy = SameSiteMode.None,
                    Secure = CookieSecurePolicy.Always,
                });
            }

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
                ForwardLimit = 1
            });


            app.UseCors("default");
            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();




            //_ = app.UseForwardedHeaders();
            //_ = app.Use((context, next) =>
            //{
            //    if (context.Request.Headers.TryGetValue("X-Forwarded-Proto", out StringValues proto))
            //    {
            //        context.Request.Scheme = proto;
            //    }
            //    return next();
            //});

            // app.UseIdentity(); // not needed, since UseIdentityServer adds the authentication middleware
            app.UseIdentityServer();


            if (!bool.Parse(Configuration["IsDevMode"]))
            {
                app.UseHttpsRedirection();
                app.UseMiddleware<SecurityHeaderMiddleware>();
                app.UseMiddleware<QueryValidationMiddleware>();
                app.UseMiddleware<InputValidationMiddleware>();
            }

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(name: "default", pattern: "{controller=Home}/{Action=Index}/{id?}");
                endpoints.MapRazorPages();
            });
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "IdentityServerWebApi v1"));

            InitializeDatabase(app);


        }


        public static void InitializeDatabase(IApplicationBuilder app)
        {
            var serviceScopeFactory = app.ApplicationServices.GetService<IServiceScopeFactory>();
            if (serviceScopeFactory == null)
                return;
            using (var scope = serviceScopeFactory.CreateScope())
            {
                if (scope == null)
                    return;

                var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                if (ctx == null || ctx.Database == null)
                    return;
                ctx.Database.Migrate();
            }
        }
    }

}
