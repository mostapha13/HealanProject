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
using Microsoft.Extensions.Logging;
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
    public class LoginCommand : IRequest<LoginResponse>
    {
        public string UserName { get; set; }
        public string Password { get; set; }
        public string CaptchaKey { get; set; }
        public string CaptchaCode { get; set; }
        /// <summary>When true, captcha must be validated (after a failed attempt).</summary>
        public bool RequireCaptcha { get; set; }
    }
    public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICaptchaProviderService _captchaValidatorService;
        private readonly ISmsApiService _smsService;
        private readonly ILogger<LoginCommandHandler> _logger;
        public LoginCommandHandler(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ApplicationDbContext applicationDbContext, IHttpContextAccessor httpContextAccessor, ICaptchaProviderService captchaValidatorService, ISmsApiService smsService, ILogger<LoginCommandHandler> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _applicationDbContext = applicationDbContext;
            _httpContextAccessor = httpContextAccessor;
            _captchaValidatorService = captchaValidatorService;
            _smsService = smsService;
            _logger = logger;
        }
        public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
        {


            await _signInManager.SignOutAsync();

#if !DEBUG
            if (request.RequireCaptcha)
            {
                var captchaResult = await _captchaValidatorService.ValidateCaptcha(new CaptchaModelRequest(request.CaptchaKey, request.CaptchaCode));
                if (captchaResult == null || !captchaResult.Result)
                {
                    throw new BadRequestExceptions("کد کپچا صحیح نیست");
                }
            }
#endif
            var getUser = _applicationDbContext.Users.FirstOrDefault(x => x.UserName == request.UserName);


            if (getUser == null)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }
            if (!getUser.IsActive)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }


            //_userManager.GenerateNewTwoFactorRecoveryCodesAsync(getUser,)

            var result = await _signInManager.PasswordSignInAsync(request.UserName, request.Password, false, true);

            if (result == Microsoft.AspNetCore.Identity.SignInResult.Success)
            {
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
                bool isAdmin = false;
                var roles = await _userManager.GetRolesAsync(getUser);
                foreach (var role in roles)
                    isuser.AdditionalClaims.Add(new Claim("role", role));
                await _httpContextAccessor.HttpContext.SignInAsync(isuser, props);

                getUser.LastLoginDate = DateTimeHelper.GetCurrentDateTime();
                getUser.CodeSendedDateTime = null;


                var forwarded = _httpContextAccessor.HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                _logger.LogInformation($"X-Forwarded-For: {forwarded}");
                if (forwarded != null)
                    getUser.LastLoginIP = forwarded.ToString();
                else
                    getUser.LastLoginIP = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();
                await _applicationDbContext.SaveChangesAsync(cancellationToken);


                return new LoginResponse() { userId = getUser.Id.ToString(), TwoFactorEnabled = getUser.TwoFactorEnabled, IsSuccess = true, IsAdmin = roles.Contains("Admin") };
            }
            if (result == Microsoft.AspNetCore.Identity.SignInResult.TwoFactorRequired)
            {
                // Password already verified. Cooldown from forgot-password must not block login 2FA.
                _smsService.ClearSmsRateLimit(getUser.PhoneNumber);

                var code = await _userManager.GenerateTwoFactorTokenAsync(getUser, "CustomPhone");

                getUser.CodeSendedDateTime = DateTimeHelper.GetCurrentDateTime();

                if (string.IsNullOrWhiteSpace(code))
                {
                    throw new BadRequestExceptions("Code Not Generated");
                }

                var smsResult = await _smsService.SendSMS(new SMSModelRequest()
                {
                    PhoneNumbers = new List<string>() { getUser.PhoneNumber },
                    Message = $"مطب Healan\nکد تأیید ورود: {code}",
                });

                if (smsResult != null && !string.IsNullOrWhiteSpace(smsResult.ErrorMessage))
                    throw new BadRequestExceptions($"ارسال پیامک ناموفق بود: {smsResult.ErrorMessage}");

                await _applicationDbContext.SaveChangesAsync(cancellationToken);

                return new LoginResponse()
                {
                    userId = getUser.Id.ToString(),
                    TwoFactorEnabled = true,
                    IsSuccess = true
                };
            }
            throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");

        }
        private void AddDepartmentCalim(IdentityServerUser identityServerUser, DepartmentId departmentId)
        {
            identityServerUser.AdditionalClaims.Add(new Claim(Share.Domain.Constants.WellKnownNames.DepartmentClaimName, departmentId.ToString()));
        }
    }






}
