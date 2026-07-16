using IdentityServer.Application.ContextMaps.Users.Login.Query;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer4;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Caching.Memory;
using Share.Application.Common.Interfaces;
using Share.Domain.Constants;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.Users.Login.Command
{
    public class Login2FACommand : IRequest<Login2FAResponse>
    {
        public string Code { get; set; }
        //public bool RememberMe { get; set; }
        //public bool RememberBrowser { get; set; }
    }
    public class Login2FACommandHandler : IRequestHandler<Login2FACommand, Login2FAResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICaptchaProviderService _captchaValidatorService;
        private readonly IMemoryCache _memoryCache;
        public Login2FACommandHandler(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ApplicationDbContext applicationDbContext, IHttpContextAccessor httpContextAccessor, ICaptchaProviderService captchaValidatorService, IMemoryCache memoryCache)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _applicationDbContext = applicationDbContext;
            _httpContextAccessor = httpContextAccessor;
            _captchaValidatorService = captchaValidatorService;
            _memoryCache = memoryCache;
        }
        public async Task<Login2FAResponse> Handle(Login2FACommand request, CancellationToken cancellationToken)
        {

            var getUser = await _signInManager.GetTwoFactorAuthenticationUserAsync();
            if (getUser == null)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }
            if (!getUser.IsActive)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }
            if (!getUser.CodeSendedDateTime.HasValue)
                throw new BadRequestExceptions("کد اعتبار سنجی ارسال نشده است");
            if (DateTimeHelper.GetCurrentDateTime().Subtract(getUser.CodeSendedDateTime.Value).TotalSeconds > 120)
                throw new BadRequestExceptions("کد وارد شده منقضی شده است");


            string key = $"{request.Code}-{getUser.Id}";
            object ob = null;


            if (_memoryCache.TryGetValue(key, out ob))
            {
                request.Code = "000000";
            }

            var result = await _signInManager.TwoFactorSignInAsync("CustomPhone", request.Code, false, false);


            if (result == Microsoft.AspNetCore.Identity.SignInResult.Success)
            {
                ob = "";
                _memoryCache.Set(key, ob);



                // only set explicit expiration here if user chooses "remember me". 
                // otherwise we rely upon expiration configured in cookie middleware.
                AuthenticationProperties props = null;

                //if (model.RememberMe)
                //{
                props = new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.Add(new TimeSpan(1, 1, 1))
                };
                //};

                var isuser = new IdentityServerUser(getUser.Id.ToString())
                {
                    DisplayName = getUser.UserName
                };

                AddDepartmentCalim(isuser, getUser.DepartmentId);

                var roles = await _userManager.GetRolesAsync(getUser);
                foreach (var role in roles)
                    isuser.AdditionalClaims.Add(new Claim("role", role));
                await _httpContextAccessor.HttpContext.SignInAsync(isuser, props);

                getUser.LastLoginDate = DateTimeHelper.GetCurrentDateTime();
                getUser.CodeSendedDateTime = null;

                var forwarded = _httpContextAccessor.HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                if (forwarded != null)
                    getUser.LastLoginIP = forwarded.ToString();
                else
                    getUser.LastLoginIP = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();

                await _applicationDbContext.SaveChangesAsync(cancellationToken);

                // Do not regenerate / re-verify the OTP here — that invalidates the just-used
                // code and can leave SignInManager in a bad state after a successful login.
                return new Login2FAResponse() { userId = getUser.Id.ToString(), IsSuccess = true, IsAdmin = roles.Contains("Admin") };
            }
            if (result == Microsoft.AspNetCore.Identity.SignInResult.LockedOut)
            {
                throw new BadRequestExceptions("تعداد تلاش برای ورود بیشتر از حد مجاز است.برای برداشتن محدودیت کاربر با پشتیبانی تماس بگیرید");
            }
            throw new BadRequestExceptions("کد وارد شده صحیح نیست");

        }
        private void AddDepartmentCalim(IdentityServerUser identityServerUser, DepartmentId departmentId)
        {
            identityServerUser.AdditionalClaims.Add(new Claim(Share.Domain.Constants.WellKnownNames.DepartmentClaimName, departmentId.ToString()));
        }
    }
}
